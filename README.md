# 📚 NEU Library Visitor Log System

## 📖 Project Overview

The **NEU Library Visitor Log System** is a web-based application developed to modernize and digitize the traditional visitor logging process at New Era University. The system replaces manual logbooks with an efficient, secure, and user-friendly platform that records and manages visitor information in real time.

It supports both **student and staff access**, as well as **administrative monitoring**, ensuring accurate data collection and improved operational efficiency within the university library.


---

## https://neu-library-visitor-log-eefe3.web.app/

---


## 🎯 Objectives

* To provide a **digital solution** for recording library visits
* To ensure **accurate and organized data management**
* To enhance **user convenience** through multiple login options
* To implement **role-based access control** for administrators
* To improve overall **library monitoring and reporting**

---

## ⚙️ System Features

### 👤 Visitor Module

* Login using **Student ID**
* Login using **Google Authentication (@neu.edu.ph only)**
* First-time user registration
* Selection of visit purpose (e.g., Reading, Research, Internet Access)
* Automatic recording of visit details
* Optional identification as employee (faculty/staff)
* Responsive interface with real-time feedback

---

### 🔐 Administrator Module

* Secure login via authorized Google accounts
* Role-based access control
* Admin registration for first-time users
* Access to visitor records
* User management (including blocking/unblocking users)
* Data export functionality (PDF format)

---

### 🎨 User Interface

* Clean and responsive layout
* Animated transitions and hover effects
* Blurred background slideshow for improved aesthetics
* Real-time date and time display
* Intuitive navigation and workflow

---

## 🛠️ Technologies Used

| Technology                  | Purpose                       |
| --------------------------- | ----------------------------- |
| **React (Vite)**            | Frontend development          |
| **Firebase Authentication** | User authentication           |
| **Cloud Firestore**         | Database management           |
| **React Router**            | Page navigation               |
| **jsPDF & AutoTable**       | Report generation             |
| **JavaScript & CSS**        | Application logic and styling |

---

## 🏗️ System Architecture

The system follows a **client-server architecture** using Firebase as a Backend-as-a-Service (BaaS):

* **Frontend:** React-based user interface
* **Backend:** Firebase Authentication and Firestore Database
* **Data Flow:** User input → Validation → Firestore storage → Admin access

---

## 📂 Project Structure

```id="1b4s6u"
src/
│
├── pages/
│   ├── Login.jsx
│   ├── VisitorPage.jsx
│   ├── AdminPage.jsx
│   ├── AdminRegister.jsx
│
├── components/
│   └── Background.jsx
│
├── assets/
│   ├── library.jpg
│   ├── lib.jpg
│   ├── libr.jpg
│   └── neu.png
│
├── firebase.js
├── App.jsx
└── main.jsx
```

---

## 🔑 System Workflow

### Visitor Process

1. User selects login method (Student ID or Google)
2. System verifies user credentials
3. New users complete registration form
4. User selects purpose of visit
5. Visit data is stored in the database

---

### Administrator Process

1. Admin logs in using authorized Google account
2. System verifies admin privileges
3. Admin accesses dashboard for monitoring and management
4. Admin can view, filter, and export visitor records

---

## 🗄️ Database Design

### Users Collection

```id="8j7c1s"
{
  studentId: string,
  name: string,
  email: string,
  program: string,
  college: string,
  role: "user" | "admin",
  isBlocked: boolean,
  isEmployee: boolean,
  photoURL: string,
  createdAt: timestamp
}
```

### Visits Collection

```id="p1m3hv"
{
  studentId: string,
  name: string,
  email: string,
  program: string,
  college: string,
  reason: string,
  isEmployee: boolean,
  timestamp: timestamp
}
```

---

## 🔒 Security Measures

* Restriction to **@neu.edu.ph** email accounts for authentication
* Role-based access control for administrators
* Firestore security rules to prevent unauthorized access
* Validation of user inputs before database operations

---

## ⚙️ Installation Guide

1. Clone the repository:

```id="f7v2kz"
git clone https://github.com/your-username/neu-library-visitor-log.git
```

2. Install dependencies:

```id="r2j8n0"
npm install
```

3. Run the application:

```id="r8q0fz"
npm run dev
```

4. Build for production:

```id="q9x3rm"
npm run build
```

---

## 📈 Future Enhancements

* Integration of **RFID-based login system**
* Advanced **analytics dashboard** for administrators
* Mobile and tablet optimization (kiosk mode)
* Deployment to cloud hosting platforms
* Notification and alert system

---

## 👨‍💻 Developer

**Fredrick John J. Sapinoro**<br>*2nd Year Bachelor of Science in Information Technology*




