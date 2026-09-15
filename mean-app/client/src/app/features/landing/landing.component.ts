import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { gsap } from 'gsap';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroVisual', { static: false }) heroVisualRef?: ElementRef<HTMLDivElement>;
  @ViewChild('landingContainer', { static: false }) landingContainerRef?: ElementRef<HTMLDivElement>;

  isMobileMenuOpen = false;
  currentYear = new Date().getFullYear();
  private gsapCtx?: gsap.Context;
  private isBrowser = false;
  private prefersReducedMotion = false;

  // Mouse tilt state
  private targetRotateX = 12;
  private targetRotateY = -18;
  private currentRotateX = 12;
  private currentRotateY = -18;
  private animFrameId?: number;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initGsapAnimations();
  }

  ngOnDestroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    // Cleanly revert all GSAP animations and event listeners created in this context
    if (this.gsapCtx) {
      this.gsapCtx.revert();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  scrollToSection(sectionId: string): void {
    this.closeMobileMenu();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isBrowser || this.prefersReducedMotion || window.innerWidth < 1024) return;

    const { innerWidth, innerHeight } = window;
    const normX = (event.clientX / innerWidth) * 2 - 1; // -1 to 1
    const normY = (event.clientY / innerHeight) * 2 - 1; // -1 to 1

    // Subtly alter base 3D angle: base is rotateX(12deg), rotateY(-18deg)
    this.targetRotateY = -18 + normX * 8;
    this.targetRotateX = 12 - normY * 6;
  }

  private initGsapAnimations(): void {
    if (!this.landingContainerRef) return;

    this.gsapCtx = gsap.context(() => {
      if (this.prefersReducedMotion) {
        // Reduced motion: show elements immediately without sliding/scaling
        gsap.set('.gsap-fade-in, .gsap-hero-title, .gsap-hero-badge, .gsap-hero-sub, .gsap-hero-cta, .gsap-hero-badges, .hero-3d-scene', {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: 'all'
        });
        return;
      }

      // Initial Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.gsap-hero-badge', {
        opacity: 0,
        y: -20,
        duration: 0.7
      })
      .from('.gsap-hero-title', {
        opacity: 0,
        y: 35,
        duration: 0.85,
      }, '-=0.4')
      .from('.gsap-hero-sub', {
        opacity: 0,
        y: 25,
        duration: 0.7
      }, '-=0.5')
      .from('.gsap-hero-cta', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1
      }, '-=0.4')
      .from('.gsap-hero-pills .pill-item', {
        opacity: 0,
        y: 15,
        duration: 0.5,
        stagger: 0.08
      }, '-=0.3')
      .from('.hero-3d-scene', {
        opacity: 0,
        scale: 0.88,
        duration: 1.1,
        ease: 'power2.out'
      }, '-=0.8')
      .from('.gsap-hero-trust-bar', {
        opacity: 0,
        y: 30,
        duration: 0.8
      }, '-=0.5');

      // Continuous Floating Animations on 3D elements
      gsap.to('.laptop-container', {
        y: -10,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Individual floating offsets for orbiting cards
      gsap.to('.orbit-card-ai', {
        y: -12,
        x: -4,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.2
      });

      gsap.to('.orbit-card-tax', {
        y: 10,
        x: 4,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5
      });

      gsap.to('.orbit-card-budget', {
        y: -8,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.1
      });

      gsap.to('.orbit-card-reports', {
        y: 12,
        duration: 3.0,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.4
      });

      gsap.to('.floating-coin-1', {
        y: -14,
        rotation: 8,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      gsap.to('.floating-coin-2', {
        y: 15,
        rotation: -10,
        duration: 3.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.3
      });

      // Start mouse parallax RAF loop
      this.startParallaxLoop();

      // Simple intersection-based scroll reveal for subsequent sections
      this.initScrollReveals();
    }, this.landingContainerRef.nativeElement);
  }

  private startParallaxLoop(): void {
    const loop = () => {
      // Smooth lerp (linear interpolation)
      this.currentRotateX += (this.targetRotateX - this.currentRotateX) * 0.08;
      this.currentRotateY += (this.targetRotateY - this.currentRotateY) * 0.08;

      if (this.heroVisualRef && this.heroVisualRef.nativeElement) {
        const el = this.heroVisualRef.nativeElement;
        el.style.transform = `perspective(1200px) rotateX(${this.currentRotateX.toFixed(2)}deg) rotateY(${this.currentRotateY.toFixed(2)}deg)`;
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private initScrollReveals(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el) => observer.observe(el));
  }
}
