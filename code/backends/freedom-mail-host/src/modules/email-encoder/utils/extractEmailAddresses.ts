import type { ParsedEmail } from "../../../types/ParsedEmail";
import type { AddressObject, EmailAddress } from 'mailparser';

/**
 * Helper function to extract email addresses from all recipient fields
 * @param email The parsed email object
 * @returns Array of unique email addresses
 */
export function extractEmailAddresses(email: ParsedEmail): Set<string> {
    const addresses: Set<string> = new Set();

    // Function to process address objects and extract email addresses
    const processAddressObject = (addressObj: AddressObject | AddressObject[] | undefined) => {
      if (!addressObj) return;
      
      // Handle array of address objects (old format)
      if (Array.isArray(addressObj)) {
        addressObj.forEach(addr => {
          if ('address' in addr && addr.address && typeof addr.address === 'string') {
            addresses.add(addr.address);
          } else if ('value' in addr) {
            // New format
            processEmailAddresses(addr.value);
          }
        });
      } 
      // Handle single address object
      else {
        // New format with value array
        if ('value' in addressObj && Array.isArray(addressObj.value)) {
          processEmailAddresses(addressObj.value);
        }
        // Old format with direct address property
        else if ('address' in addressObj && addressObj.address && typeof addressObj.address === 'string') {
          addresses.add(addressObj.address);
        }
      }
    };
    
    // Function to recursively process EmailAddress objects including nested groups
    const processEmailAddresses = (emailAddresses: EmailAddress[] | undefined) => {
      if (!emailAddresses) return;
      
      for (const addr of emailAddresses) {
        // Add the email address if it exists and is a string
        if (addr.address && typeof addr.address === 'string') {
          addresses.add(addr.address);
        }
        
        // Recursively process any grouped addresses
        if (addr.group) {
          processEmailAddresses(addr.group);
        }
      }
    };

    // Process to, cc and bcc fields
    processAddressObject(email.to);
    processAddressObject(email.cc);
    processAddressObject(email.bcc);

    return addresses;
  }
