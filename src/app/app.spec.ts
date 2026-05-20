import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const router: Router = TestBed.inject(Router);
    await router.navigateByUrl('/errant-du-temps');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled: unknown = fixture.nativeElement;

    if (!(compiled instanceof HTMLElement)) {
      throw new Error('Expected fixture root to be an HTMLElement.');
    }

    expect(compiled.querySelector('h1')?.textContent).toContain('Errant du Temps');
  });
});
