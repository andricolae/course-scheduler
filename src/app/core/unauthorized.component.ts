import { Component } from "@angular/core";

@Component({
  standalone: true,
  template: `<div class="p-6 text-center text-red-600 text-xl font-semibold">Not authorized to access this page or your account has been deleted!</div>`,
})
export class UnauthorizedComponent {}
