import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
// 1. 引入 Nav (之前做好的)
import { Nav } from './nav/nav'; 
// 2. 引入 Home (新加的，注意路径)
import { Home } from './home/home'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // 3. 关键步骤：把 Home 加入这个数组
  imports: [CommonModule, RouterOutlet, Nav, Home], 
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'recipe-app';
}