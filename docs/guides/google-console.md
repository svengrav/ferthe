# Google Cloud & Play Console Setup

> Configure Google Cloud and Google Play Console for app deployment and distribution. Includes service account creation, API activation, and permission management.

## Links

- [Expo: Google Service Account Setup](https://github.com/expo/fyi/blob/main/creating-google-service-account.md)
- [Google Cloud Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts/details/113684707393379169935?hl=de&project=ferthe-app)
- [Google Play Android Developer API](https://console.cloud.google.com/apis/api/androidpublisher.googleapis.com/metrics?project=ferthe-app)
- [Google Play Console](https://play.google.com/console/u/0/developers/8013994114288529085/app-list)

## Prerequisites

- Google Cloud account with billing enabled
- Google Play Developer account
- Project created in Google Cloud Console

## Configuration

### Create Service Account

1. Open [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=ferthe-app)
2. Click **"Create Service Account"**
3. Enter name: `ferthe-expo-service-account`
4. Assign role: **"Editor"** (or specific permissions)
5. Confirm

### Generate API Keys

1. Open service account
2. Navigate to **"Keys"** tab
3. **"Add Key"** → **"Create new key"** → **JSON**
4. Download and store securely (required for deployments)

### Enable Google Play API

1. Open [APIs Library](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com?project=ferthe-app)
2. Search **"Google Play Android Developer API"**
3. Click **"Enable"**

### Configure Permissions

1. Open [Play Console > Users & Permissions](https://play.google.com/console)
2. Add service account email: `ferthe-expo-service-account@ferthe-app.iam.gserviceaccount.com`
3. Assign permissions:
   - **Account permissions**: Global access
   - **App permissions**: App-specific access
4. Confirm

### Verify Configuration

**Configuration checklist:**

- Service account status: **Active**
- Access expiration: **Never expires**
- Service account has access to app **ferthe**

## Troubleshooting

| Issue | Solution |
|---|---|
| Permission Denied | Verify service account has required IAM roles |
| API Not Enabled | Enable all required APIs in Google Cloud Console |
| Authentication Failed | Validate JSON key file |
