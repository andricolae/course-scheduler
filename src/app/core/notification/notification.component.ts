import { NgClass } from '@angular/common';
import { Component, signal } from '@angular/core';

type MessageType = 'alert' | 'notification' | 'success';

@Component({
  selector: 'app-notification',
  imports: [NgClass],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent {
  private static instance: NotificationComponent;

  visible = signal(false);
  message = signal('');
  type = signal<MessageType>('notification');

  constructor() {
    NotificationComponent.instance = this;
  }

  static show(type: MessageType, message: string, durationMs: number = 4000) {
    if (NotificationComponent.instance) {
      NotificationComponent.instance.message.set(message);
      NotificationComponent.instance.type.set(type);
      NotificationComponent.instance.visible.set(true);

      setTimeout(() => {
        NotificationComponent.instance.visible.set(false);
      }, durationMs);
    }
  }
}
