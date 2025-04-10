import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./core/navbar/navbar.component";
import { NotificationComponent } from "./core/notification/notification.component";
import { CoursesEffects } from './state/courses/course.effects';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, RouterOutlet, NotificationComponent],
  providers: [CoursesEffects],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Course Scheduler';
}
