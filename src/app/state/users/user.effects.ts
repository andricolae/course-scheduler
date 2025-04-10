import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as UserActions from './user.actions';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Injectable()
export class UsersEffects {
  constructor(
    private actions$: Actions,
    private dbService: UserService,
    private router: Router
  ) {}

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUsers),
      mergeMap(() =>
        this.dbService.getUsers().pipe(
          map((users) => UserActions.loadUsersSuccess({ users })),
          catchError((err) =>
            of(UserActions.loadUsersFail({ error: err.message }))
          )
        )
      )
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.deleteUser),
      mergeMap(({ userId }) =>
        this.dbService.deleteUser(userId).pipe(
          map(() => UserActions.deleteUserSuccess({ userId })),
          tap(() => console.log(`Deleted user with id: ${userId}`)),
          catchError((err) =>
            of(UserActions.deleteUserFail({ error: err.message }))
          )
        )
      )
    )
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateUser),
      mergeMap(({ user }) =>
        this.dbService.updateUser(user).pipe(
          map(() => UserActions.updateUserSuccess({ user })),
          catchError((err) =>
            of(UserActions.updateUserFail({ error: err.message }))
          )
        )
      )
    )
  );
}
