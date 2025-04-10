import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.css'
})
export class ConfirmationDialogComponent {
  isOpen = signal(false);
  message = signal('Are you sure?');
  private resolver: ((confirmed: boolean) => void) | null = null;

  open(message = 'Are you sure?'): Promise<boolean> {
    this.message.set(message);
    this.isOpen.set(true);
    return new Promise(resolve => {
      this.resolver = resolve;
    });
  }

  confirm() {
    this.isOpen.set(false);
    this.resolver?.(true);
    this.resolver = null;
  }

  cancel() {
    this.isOpen.set(false);
    this.resolver?.(false);
    this.resolver = null;
  }
}
