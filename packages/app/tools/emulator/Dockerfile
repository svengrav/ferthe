# Base image: Node.js + Java
FROM node:20-bookworm

# ============================================
# VERSION CONFIGURATION
# Update these variables for version upgrades
# ============================================
ARG NODE_VERSION=20
ARG JAVA_VERSION=17
ARG ANDROID_API_LEVEL=35
ARG ANDROID_BUILD_TOOLS_VERSION=35.0.0
ARG ANDROID_NDK_VERSION=26.1.10909125
ARG ANDROID_COMMANDLINE_TOOLS_VERSION=11076708
ARG GRADLE_VERSION=8.14.3

# Environment variables
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools
ENV JAVA_HOME=/usr/lib/jvm/java-${JAVA_VERSION}-openjdk-amd64

# Install dependencies
RUN apt-get update && apt-get install -y \
  openjdk-${JAVA_VERSION}-jdk \
  wget \
  unzip \
  git \
  && rm -rf /var/lib/apt/lists/*

# Install Android SDK
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && \
  cd ${ANDROID_SDK_ROOT}/cmdline-tools && \
  wget https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_COMMANDLINE_TOOLS_VERSION}_latest.zip -O commandlinetools.zip && \
  unzip -q commandlinetools.zip && \
  mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools/latest && \
  mv cmdline-tools/* ${ANDROID_SDK_ROOT}/cmdline-tools/latest/ && \
  rm -rf cmdline-tools commandlinetools.zip

# Install Android SDK components
RUN yes | ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses && \
  ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} \
  "platform-tools" \
  "platforms;android-${ANDROID_API_LEVEL}" \
  "build-tools;${ANDROID_BUILD_TOOLS_VERSION}" \
  "ndk;${ANDROID_NDK_VERSION}"

# Install EAS CLI (expo-cli is deprecated)
RUN npm install -g eas-cli@latest

# Working directory
WORKDIR /app

CMD [ "bash" ]
