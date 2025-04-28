FROM node:22

WORKDIR /actions-runner

RUN useradd -m runner \
    && chown -R runner:runner /actions-runner

USER runner

RUN curl -o actions-runner.tar.gz -L \
    https://github.com/actions/runner/releases/download/v2.323.0/actions-runner-linux-x64-2.323.0.tar.gz \
    && echo "0dbc9bf5a58620fc52cb6cc0448abcca964a8d74b5f39773b7afcad9ab691e19  actions-runner.tar.gz" | shasum -a 256 -c \
    && tar xzf ./actions-runner.tar.gz \
    && rm ./actions-runner.tar.gz

COPY entrypoint.sh .

CMD ["./entrypoint.sh"]
