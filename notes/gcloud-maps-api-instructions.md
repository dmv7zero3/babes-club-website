# Google Cloud CLI: Creating a Project and Google Maps API Key

This guide explains how to create a new Google Cloud project and generate a Google Maps API key using the `gcloud` CLI. You can reuse these steps for any website or project.

---

# Template Instructions

## Prerequisites

- Google Cloud CLI (`gcloud`) installed and authenticated
- Billing account set up in Google Cloud

## Steps

### 1. Create a New Project

```
gcloud projects create <PROJECT_ID> --name="<PROJECT_NAME>"
```

Replace `<PROJECT_ID>` (must be unique) and `<PROJECT_NAME>` with your desired values.

### 2. Set the Project as Default

```
gcloud config set project <PROJECT_ID>
```

### 3. Enable the Maps JavaScript API

```
gcloud services enable maps.googleapis.com
```

### 4. Create an API Key

```
gcloud alpha services api-keys create --display-name="<API_KEY_NAME>"
```

Replace `<API_KEY_NAME>` with a descriptive name (e.g., "My Website Maps Key").

### 5. (Recommended) Restrict the API Key

Restrict the API key to specific HTTP referrers for security:

- Go to the [Google Cloud Console API Keys page](https://console.cloud.google.com/apis/credentials)
- Click on your API key
- Set application restrictions (e.g., HTTP referrers)
- Save changes

## Notes

- Make sure billing is enabled for your project.
- You can enable other APIs as needed using `gcloud services enable <API_NAME>`.
- Always restrict your API keys to prevent unauthorized use.

---

**Reference:** [Google Maps Platform Documentation](https://developers.google.com/maps/documentation/javascript/get-api-key)

---

# Real-Life Example: Moon Lounge

Follow these steps using the actual values for Moon Lounge:

## 1. Create the Project

```sh
gcloud projects create moon-lounge-sterling-va --name="Moon Lounge"
```

## 2. Set the Project as Default

```sh
gcloud config set project moon-lounge-sterling-va
```

## 3. Enable the Maps JavaScript API

```sh
gcloud services enable maps.googleapis.com
```

## 4. Create an API Key

```sh
gcloud alpha services api-keys create --display-name="Moon Lounge Maps Key"
```

## 5. Restrict the API Key

1. Go to the [Google Cloud Console API Keys page](https://console.cloud.google.com/apis/credentials)
2. Click on your new API key (named "Moon Lounge Maps Key")
3. Set application restrictions (e.g., HTTP referrers for your domain)
4. Save changes

---

---

# Troubleshooting: Permissions & Billing via gcloud CLI

If you encounter permission errors or cannot enable APIs, use these commands to check your setup:

## 1. Check your current account and project

```sh
gcloud config list
```

## 2. Check your IAM roles for the project

```sh
gcloud projects get-iam-policy moon-lounge-sterling-va --flatten='bindings[].members' --format='table(bindings.role)' --filter="bindings.members:$(gcloud config get-value account)"
```

This shows the roles your account has for the project.

## 3. Check if billing is enabled

```sh
gcloud beta billing projects describe moon-lounge-sterling-va
```

Look for `billingAccountName` in the output. If missing, billing is not enabled.

## 4. Link a billing account to your project (if billing is not enabled)

First, list your billing accounts:

```sh
gcloud beta billing accounts list
```

Find the ACCOUNT_ID you want to use (for example, Matriz Inc. is 019110-47A22C-1B6970).

Then, link the billing account to your project:

```sh
gcloud beta billing projects link moon-lounge-sterling-va --billing-account=019110-47A22C-1B6970
```

Replace the billing account ID if you want to use a different one.

After linking, billing will be enabled and you can enable the Maps API.

## 4. List all users and their roles (requires permissions)

```sh
gcloud projects get-iam-policy moon-lounge-sterling-va --format=json
```

If you do not have the right permissions or billing is not enabled, contact your Google Cloud admin for help.

---

Now you have both a template, a real-life example, and troubleshooting steps for Moon Lounge. Repeat the template steps for other projects as needed.
