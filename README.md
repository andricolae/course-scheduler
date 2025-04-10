# School Manager App 🏫

[![Deployment Status](https://img.shields.io/badge/deployment-active-brightgreen)](https://school-mngr.vercel.app/)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031)](https://angular.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Integrated-FFA000)](https://firebase.google.com/)

## 🔍 Overview

The School Manager is an Angular application developed to streamline educational institution management processes. This tool enables efficient student registration, attendance tracking, grade management, and communication between teachers, students, and parents.

## ✨ Features

* **Student Management**: Register and manage student information with an intuitive interface
* **Attendance Tracking**: Record and monitor student attendance *(coming in V3)*
* **Grade Management**: Enter, calculate, and analyze student grades
* **Communication Portal**: Connect teachers, students, and parents *(coming in V3)*
* **Reports**: Generate detailed academic reports across various time periods *(coming in V2)*
* **Export Options**: Download reports in multiple formats (PDF, CSV, Excel) *(coming in V2)* 

## 🚀 Getting Started

### Prerequisites

* Node.js (v20.0 or higher)
* Angular CLI (v19.0 or higher)
* npm (v10.0 or higher)
* Firebase account

## 🔥 Firebase Configuration

This project uses Firebase services and requires proper configuration via environment variables. 

### 📋 Prerequisites:

1. You need a Firebase account. If you don't have one, sign up at [firebase.google.com](https://firebase.google.com/).
2. Create a new Firebase project or use an existing one.
3. Configure the following services in your Firebase project:
   * Firebase Authentication
   * Cloud Firestore
   * Google Analytics (optional, but required for the measurement ID)

> [!NOTE]
> All these services must be properly configured before the application can function correctly.

### 🔑 Getting your Firebase Configuration Keys:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview" to access Project settings
4. Scroll down to "Your apps" section and select your web app (or create one by clicking the web icon </> if you haven't added one yet)
5. Under the "SDK setup and configuration" section, you'll find your Firebase configuration object which contains all the required keys
6. For Google Vision API and Gemini API keys, you'll need to enable these services in the Google Cloud Console associated with your Firebase project

### 🛠️ Additional Firebase Setup:

1. **Firebase Authentication**: Enable the authentication methods you plan to use (Email/Password, Google, etc.)
2. **Cloud Firestore**: Create a new database and set up appropriate security rules

> [!TIP]
> Consider using Firebase's development and production environments to separate your testing from live data.

## 💻 Installation

### Clone the repository:
```bash
git clone https://github.com/andricolae/school-mngr.git
```

### Navigate to the project directory:
```bash
cd school-mngr
```

### Install dependencies
```bash
npm install
```

### Set up environment variables

Create a .env file in the root directory of the project with the following structure:

```javascript
API_KEY="your-firebase-api-key"
AUTH_DOM="your-firebase-auth-domain"
PROJ_ID="your-firebase-project-id"
STORAGE="your-firebase-storage-bucket"
MESS_SEND_ID="your-firebase-messaging-sender-id"
APP_ID="your-firebase-app-id"
MEASURE_ID="your-firebase-measurement-id"
```

Replace the placeholder values with your project credentials. You can find these values in your Firebase project settings.

The "start" option in package.json will generate the environment variable script based on your .env file

```json
"start": "node -r dotenv/config mynode.js && ng serve",
```

> [!CAUTION]
> Never commit your .env or environment.ts file to version control. These files contain sensitive API keys and credentials that should remain private.

### Start the development server

```bash
ng serve
```

> [!NOTE]
> Open your browser and navigate to http://localhost:4200

## 🏗️ Architecture

##### The application follows a modular architecture with:

* Core modules for authentication, data services, and HTTP interceptors
* Feature modules
* Shared modules for common components and directives
* State management using NgRx for predictable data flow

#### Tech Stack

Frontend: Angular 19
Authentication: Firebase Auth
CI/CD: Github and Vercel

### 🤝 Contributing

As this is an internal Tech Trek project, contributions are welcome from all NTT DATA employees. 

Please follow these steps:
1. Check the issue tracker for open tasks
2. Request to be assigned to an issue
3. Create a feature branch from develop
4. Submit a merge request with your changes
5. Ensure CI/CD pipeline passes
6. Request a code review from the team

> [!IMPORTANT]
> Always create a new branch from develop for your features, not from main.

## 📝 License
This project is proprietary and confidential. The code and its assets are the exclusive property of NTT DATA. Unauthorized use, reproduction, or distribution is prohibited.
© 2025 NTT DATA | All Rights Reserved
