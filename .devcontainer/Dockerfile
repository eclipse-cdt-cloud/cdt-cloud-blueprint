# See here for image contents: https://github.com/devcontainers/images/blob/main/src/typescript-node/.devcontainer/Dockerfile

# Node.js version (use -bullseye variants on local arm64/Apple Silicon)
ARG VARIANT="20-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

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
