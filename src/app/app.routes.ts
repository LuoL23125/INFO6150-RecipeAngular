import { Routes } from '@angular/router';
import { Home } from './home/home';
import { RecipeDetail } from './recipe-detail/recipe-detail';
import { Login } from './login/login';
import { Register } from './register/register';
import { Profile } from './profile/profile';
import { AddRecipe } from './add-recipe/add-recipe';
import { AdvancedSearch } from './advanced-search/advanced-search';
import { MealPlanner } from './meal-planner/meal-planner'; // <--- 新增

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'recipe/:id', component: RecipeDetail },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'profile', component: Profile },
  { path: 'add-recipe', component: AddRecipe },
  { path: 'edit-recipe/:id', component: AddRecipe },
  { path: 'advanced-search', component: AdvancedSearch },
  { path: 'meal-planner', component: MealPlanner }, // <--- 新增路由
  { path: '**', redirectTo: '' }
];