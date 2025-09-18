import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
   standalone: true,          // ✅ अब यह standalone है
  imports: [RouterOutlet],   // ✅ Router का use

  template: `<router-outlet></router-outlet>`
  // styleUrls: ['./app.component.scss']
})
export class AppComponent {}


