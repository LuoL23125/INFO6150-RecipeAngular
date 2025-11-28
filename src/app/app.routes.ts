import { Routes } from '@angular/router';
import { Home } from './home/home';
import { RecipeDetail } from './recipe-detail/recipe-detail';
import { Login } from './login/login'; // <--- 新增
import { Register } from './register/register'; // <--- 新增

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'recipe/:id', component: RecipeDetail },
  { path: 'login', component: Login },       // <--- 新增
  { path: 'register', component: Register }, // <--- 新增
  { path: '**', redirectTo: '' }
];