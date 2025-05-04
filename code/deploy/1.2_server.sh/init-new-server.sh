#!/bin/bash
set -e

# Define constants
ENV_NAME=dev
ADMIN_USERS=( # also ensure that all the SSH pub keys are in $PUB_KEYS_DIR (see below)
  "pavel"
  "brian"
)

# Check if server IP is provided
if [ -z "$1" ]; then
  echo "Error: Server IP address is required as the first parameter"
  echo "Usage: $0 <server-ip> <hostname>"
  exit 1
fi

# Check if hostname is provided
if [ -z "$2" ]; then
  echo "Error: Hostname is required as the second parameter"
  echo "Usage: $0 <server-ip> <hostname>"
  exit 1
fi

SERVER_IP="$1"
HOSTNAME="$2"
USER_SERVER="root@$SERVER_IP"
SCRIPT_DIR="$(realpath "$(dirname "${BASH_SOURCE[0]}")")"
SECRETS_DIR="$(realpath "$SCRIPT_DIR/../../secrets")"
PUB_KEYS_DIR="$(realpath "$SECRETS_DIR/$ENV_NAME/secrets")"
SHARED_DIR="$(realpath "$SCRIPT_DIR/../shared")"

# Initialize the full init script
echo "Initializing server IP=$SERVER_IP HOSTNAME=$HOSTNAME..."
FULL_INIT_SCRIPT="$(cat "$SHARED_DIR/init-docker-machine.sh")"


### Set hostname ###
FULL_INIT_SCRIPT="$FULL_INIT_SCRIPT"$'\n\n\n'$(cat <<EOF
  ### Set hostname ###
  echo "Setting hostname to $HOSTNAME..."
  echo "$HOSTNAME" > /etc/hostname
  hostname "$HOSTNAME"
  echo "Hostname set to $HOSTNAME"
EOF
)


### Create admin users ###
# Check if every public key exists
for USER in "${ADMIN_USERS[@]}"; do
  if [ ! -f "$PUB_KEYS_DIR/$USER.pub" ]; then
    echo "Error: Public key for $USER not found at $PUB_KEYS_DIR/$USER.pub"
    exit 1
  fi
done

# Set up admin users
for USER in "${ADMIN_USERS[@]}"; do
  echo "Setting up admin user: $USER"

  # Read the public key content
  PUB_KEY="$(cat "$PUB_KEYS_DIR/$USER.pub")"

  # Add user setup script as a here-document
  FULL_INIT_SCRIPT="$FULL_INIT_SCRIPT"$'\n\n\n'$(cat <<EOF
    ### Create user '$USER' ###
    if ! id -u '$USER' &>/dev/null; then
      echo 'Creating user $USER...'

      # Create user
      useradd -m -s /bin/bash "$USER"

      # Add user to docker group
      usermod -aG docker "$USER"

      # Add user to sudoers with NOPASSWD
      echo "$USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$USER"
      chmod 440 "/etc/sudoers.d/$USER"
      mkdir -p "/home/$USER/.ssh"

      # Add public key
      echo "$PUB_KEY" > "/home/$USER/.ssh/authorized_keys"
      chmod 700 "/home/$USER/.ssh"
      chmod 600 "/home/$USER/.ssh/authorized_keys"
      chown -R "$USER:$USER" "/home/$USER/.ssh"

      echo "User $USER configured successfully"
    else
      echo "User '$USER' already exists. Skipping..."
    fi
EOF
)

done

# Add completion message
FULL_INIT_SCRIPT="$FULL_INIT_SCRIPT"$'\n\n\n'$(cat <<EOF
  ### Report ###
  echo "REMOTE: Done"
EOF
)

# Add the completion message to the full init script
FULL_INIT_SCRIPT+="$COMPLETION_MESSAGE"$'\n'

# Uncomment to debug
# echo $'======\n======\n======\n'"$FULL_INIT_SCRIPT"$'\n======\n======\n======'
# echo "$FULL_INIT_SCRIPT" > ./test.sh

# Execute the full script in one SSH command
echo "Executing full initialization script..."
ssh "$USER_SERVER" "$FULL_INIT_SCRIPT"

### Done ###
echo "LOCAL: Done"
