import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 检查是否是管理员
  if (authService.isAdmin()) {
    return true; // 放行
  }

  // 不是管理员？踢回首页
  // (也可以跳转到 'login' 或显示 '403 Forbidden' 页面)
  router.navigate(['/']);
  return false;
};