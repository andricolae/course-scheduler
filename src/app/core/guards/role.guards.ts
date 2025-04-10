// src/app/core/guards/role.guards.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.user.pipe(
      take(1),
      map(user => {
        if (user && allowedRoles.includes(user.role)) {
          return true;
        } else {
          router.navigate(['/unauthorized']);
          return false;
        }
      })
    );
  };
}
