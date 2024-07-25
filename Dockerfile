# We still want Ubuntu 20.04 LTS compatibility, which is based on bullseye
# -> buster is old enough
FROM node:20.11.1-buster AS build-stage
RUN apt-get update && apt-get install -y libxkbfile-dev libsecret-1-dev
COPY . /home/theia/cdt-cloud-blueprint
WORKDIR /home/theia/cdt-cloud-blueprint
RUN yarn --pure-lockfile && \
    yarn build:extensions && \
    yarn download:plugins && \
    yarn docker build
RUN yarn tracecompass-server:download

FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-20-bullseye AS production-stage

RUN adduser --system --group theia

RUN chmod g+rw /home && \
    chown -R theia:theia /home/theia

# Theia dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends \
     software-properties-common \
     libxkbfile-dev \
     libsecret-1-dev \
     build-essential libssl-dev

# Install java for Trace Compass Server
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends \
     openjdk-17-jre

# C/C++ dependencies
RUN add-apt-repository 'deb http://apt.llvm.org/bullseye/ llvm-toolchain-bullseye-14 main'
RUN wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add -
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends \
     clang-format-14 clang-tidy-14 clang-tools-14 clang-14 clangd-14 \
     libc++-dev libc++1 libc++abi-dev libc++abi1 libclang-dev \
     libclang1 liblldb-dev libllvm-ocaml-dev libomp-dev libomp5 \
     lld lldb llvm-dev llvm-runtime llvm python3-clang \
     cmake gdb

RUN update-alternatives --install /usr/bin/clangd clangd /usr/bin/clangd-14 100
RUN update-alternatives --install /usr/bin/clang clang /usr/bin/clang-14 100

ENV CMAKE_C_COMPILER=clang-14
ENV CMAKE_CXX_COMPILER=clang++-14

ENV HOME=/home/theia
ENV THEIA_WEBVIEW_ENDPOINT={{hostname}}
WORKDIR /home/theia
COPY --from=build-stage --chown=theia:theia /home/theia /home/theia
EXPOSE 3000
ENV SHELL=/bin/bash \
    THEIA_DEFAULT_PLUGINS=local-dir:/home/theia/cdt-cloud-blueprint/plugins
ENV USE_LOCAL_GIT=true
USER theia

WORKDIR /home/theia/cdt-cloud-blueprint
ENTRYPOINT [ "node", "/home/theia/cdt-cloud-blueprint/applications/docker/src-gen/backend/main.js", "/home/theia/cdt-cloud-blueprint/applications/docker/workspace" ]
CMD [ "yarn docker start", "--hostname=0.0.0.0" ]