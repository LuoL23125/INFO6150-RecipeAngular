import { Routes } from '@angular/router';
import { Home } from './home/home';
import { RecipeDetail } from './recipe-detail/recipe-detail';
import { Login } from './login/login';
import { Register } from './register/register';
import { Profile } from './profile/profile';
import { AddRecipe } from './add-recipe/add-recipe';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'recipe/:id', component: RecipeDetail },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'profile', component: Profile },
  { path: 'add-recipe', component: AddRecipe }, 
  { path: 'edit-recipe/:id', component: AddRecipe }, // <--- 新增：复用组件用于编辑
  { path: '**', redirectTo: '' }
];