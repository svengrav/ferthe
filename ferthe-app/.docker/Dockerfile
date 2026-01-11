# Basis-Image: Node.js + Java
FROM node:20-bookworm

# ENV Variablen
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

# Abhängigkeiten installieren
RUN apt-get update && apt-get install -y \
  openjdk-17-jdk \
  wget \
  unzip \
  git \
  python3 \
  python3-pip \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

# Android SDK installieren
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && \
  cd ${ANDROID_SDK_ROOT}/cmdline-tools && \
  wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O commandlinetools.zip && \
  unzip -q commandlinetools.zip && \
  mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools/latest && \
  mv cmdline-tools/* ${ANDROID_SDK_ROOT}/cmdline-tools/latest/ && \
  rm -rf cmdline-tools commandlinetools.zip && \
  ls -la ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/

# Jetzt stimmt die Struktur:
# /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager

# Android SDK Komponenten installieren
RUN yes | ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --verbose --sdk_root=${ANDROID_SDK_ROOT} --licenses && \
  ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --verbose --sdk_root=${ANDROID_SDK_ROOT} \
  "platform-tools" \
  "platforms;android-33" \
  "build-tools;33.0.2"

# Expo und EAS installieren
RUN npm install -g expo-cli eas-cli

# Arbeitsverzeichnis
WORKDIR /app

CMD [ "bash" ]
