import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationComponent } from '../../core/notification/notification.component';
import { SpinnerComponent } from "../../core/spinner/spinner.component";
import { SpinnerService } from '../../core/services/spinner.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, SpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  isAuthenticated = false;
  isFormValid = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private spinner: SpinnerService) {}

  ngOnInit() {
    this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user;
    })
  }

  onSubmit(form: NgForm) {
    this.spinner.show()

    if (!form.valid) {
      NotificationComponent.show('alert', 'Email and Password must be valid!');
      return;
    }

    this.authService.login(this.email, this.password).pipe().subscribe({
      next: response => {
        this.spinner.hide()
        console.log('User logged in!', response);
        this.router.navigate(['/home']);
      }
    });
  }

  validateForm() {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    const passwordValid = this.password.length >= 6;

    this.isFormValid = emailValid && passwordValid;

    if (!emailValid)
      NotificationComponent.show('alert', 'Email must be valid');
    if (!passwordValid)
      NotificationComponent.show('alert', 'Password must be at least 6 characters');
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  resetPassword() {
    this.spinner.show()

    if (!this.email) {
      NotificationComponent.show('alert', 'Please enter your email before resetting the password to your account!');
      return;
    }

    this.authService.resetPassword(this.email).pipe().subscribe(
      () => {
        this.spinner.hide()
        NotificationComponent.show('success', 'If your email has been registered, a password reset link has been sent to you!');
      },
      (error) => {
        this.spinner.hide()
        console.error(error);
        NotificationComponent.show('success', 'Unable to send reset email');
      }
    );
  }
}
