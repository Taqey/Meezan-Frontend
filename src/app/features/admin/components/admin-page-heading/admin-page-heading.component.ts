import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Database } from 'lucide-angular';

@Component({
  selector: 'app-admin-page-heading',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-page-heading.component.html',
  styleUrl: './admin-page-heading.component.css'
})
export class AdminPageHeadingComponent {
  readonly DatabaseIcon = Database;
}
