# Course Scheduler

[![Deployment Status](https://img.shields.io/badge/deployment-active-brightgreen)](https://course-scheduler-ntt.vercel.app/)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031)](https://angular.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Integrated-FFA000)](https://firebase.google.com/)

An admin-focused Angular 19 application for scheduling course sessions across an educational institution.

## 🔍 Overview

The Course Scheduler is a specialized tool designed exclusively for administrators to manage and schedule course sessions. It works in tandem with the main School Manager application, focusing solely on the scheduling aspect to provide a more efficient workflow for administrators.

## ✨ Features

* **Admin-Only Access** : Secure authentication with role-based access control
* **Calendar-Based Scheduling** : Visual interface for planning course sessions
* **Conflict Prevention** : Automatic detection of scheduling conflicts
* **Seamless Integration** : Works with the main School Manager application via API

## 🚀 Technical Stack

* **Angular 19** : Using standalone components architecture
* **TailwindCSS** : For responsive and consistent design
* **NgRx** : State management for predictable data flow
* **Firebase** : Authentication and data storage

## 📋 Workflow

1. Admin logs into the Course Scheduler application
2. System displays courses pending scheduling
3. Admin uses the calendar interface to schedule sessions
4. System checks for conflicts with existing schedules
5. Admin saves the schedule
6. Updated schedule is sent back to the main system via API

## 🛠️ API Endpoints

The application communicates with the School Manager system via the following endpoints:

* `GET /pending-schedule`: Retrieves courses that need scheduling
* `POST /submit-schedule`: Sends completed schedule back to the main system

## 💻 Getting Started

### Prerequisites

* Node.js (v18 or higher)
* Angular CLI (v19)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/course-scheduler.git

# Navigate to project directory
cd course-scheduler

# Install dependencies
npm install

# Start development server
ng serve
```

### Environment Configuration

Create a `environment.ts` file in the project root with your Firebase configuration:

```typescript
export const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-auth-domain',
  projectId: 'your-project-id',
  storageBucket: 'your-storage-bucket',
  messagingSenderId: 'your-messaging-sender-id',
  appId: 'your-app-id'
};
```

[!CAUTION]
Never commit your .env or environment.ts file to version control. These files contain sensitive API keys and credentials that should remain private.

## 🏗️ Development

This project uses Angular's standalone component architecture. The main components are:

* `SchedulerComponent`: The calendar interface for scheduling
* `PendingCoursesComponent`: Displays courses needing scheduling
* `CourseSessionModalComponent`: For creating/editing sessions

State management is handled through NgRx with the following main stores:

* `courses`: Manages course data
* `auth`: Handles authentication state
* `scheduler`: Tracks scheduling-specific state

## Related Projects

* [School Manager](https://github.com/andricolae/school-mngr.git "Check the School Manager"): The main school management system

## 📝 License

This project is proprietary and confidential. The code and its assets are the exclusive property of NTT DATA. Unauthorized use, reproduction, or distribution is prohibited.
© 2025 NTT DATA | All Rights Reserved
