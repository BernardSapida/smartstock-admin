import { Button, Card, Chip } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Code2, Github, KeyRound, Layout, Server, Shield, Zap } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { APP_NAME, seo } from "@/config/seo.config";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: seo.title("Home") },
			{ name: "description", content: seo.description },
			{ property: "og:title", content: seo.title("Home") },
			{ property: "og:description", content: seo.description },
			{ property: "og:image", content: `${seo.url}${seo.ogImage}` },
			{ property: "og:url", content: seo.url },
			{ name: "twitter:card", content: seo.twitter.card },
			{ name: "twitter:title", content: seo.title("Home") },
			{ name: "twitter:description", content: seo.description },
		],
		links: [{ rel: "canonical", href: seo.url }],
	}),
	component: HomePage,
});

function HomePage() {
	return (
		<div className="min-h-screen flex flex-col bg-app-base text-text-primary">
			{/* Floating Island Navbar */}
			<header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
				<div className="w-full rounded-2xl px-6 py-3 flex items-center justify-between backdrop-blur-xl bg-app-content1/60 border border-app-default-200/50 shadow-lg">
					<div className="flex items-center gap-2 group cursor-pointer">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-brand text-white shadow-lg transition-transform group-hover:scale-110">
							<Layout className="h-6 w-6" />
						</div>
						<p className="font-serif text-xl font-bold tracking-tight">{APP_NAME}</p>
					</div>

					<nav className="hidden md:flex gap-8 items-center">
						<a
							className="text-text-secondary hover:text-app-brand transition-colors text-sm font-medium"
							href="#features"
						>
							Features
						</a>
						<a
							className="text-text-secondary hover:text-app-brand transition-colors text-sm font-medium"
							href="https://github.com"
							rel="noreferrer"
							target="_blank"
						>
							GitHub
						</a>
						<a
							className="text-text-secondary hover:text-app-brand transition-colors text-sm font-medium"
							href="https://docs.heroui.com"
							rel="noreferrer"
							target="_blank"
						>
							Docs
						</a>
					</nav>

					<div className="flex items-center gap-3">
						<ThemeToggle />
						<Link
							className="hidden sm:block"
							to="/sign-in"
						>
							<Button
								className="font-semibold text-text-secondary hover:text-text-primary"
								variant="ghost"
							>
								Log in
							</Button>
						</Link>
						<Link to="/sign-up">
							<Button className="bg-app-brand font-bold text-white shadow-lg shadow-app-brand/25 px-6">
								Get Started
							</Button>
						</Link>
					</div>
				</div>
			</header>

			<main className="flex-1">
				{/* Hero Section */}
				<section className="relative pt-48 pb-32 overflow-hidden">
					<div className="container-page relative z-10 flex flex-col items-center text-center">
						<div className="rise-in [animation-delay:100ms]">
							<Chip className="bg-app-brand/10 border-app-brand/20 text-app-brand font-bold mb-8 h-8 px-4 py-1">
								<Zap className="h-3 w-3 mr-2 inline" />
								VERSION 1.0 NOW LIVE
							</Chip>
						</div>

						<h1 className="rise-in text-5xl md:text-7xl lg:text-8xl mb-8 leading-[1.05] tracking-tighter max-w-5xl font-serif">
							Build <span className="text-app-brand inline-block transform -rotate-1 italic">Premium</span> Fullstack
							Apps Faster.
						</h1>

						<p className="rise-in [animation-delay:200ms] text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mb-12">
							The REST-first template for TanStack Start, HeroUI, and a typed API client. Stop wasting time on
							boilerplate and start building your actual product.
						</p>

						<div className="rise-in [animation-delay:300ms] flex flex-col sm:flex-row items-center justify-center gap-4 px-4 w-full">
							<Link
								className="w-full sm:w-auto"
								to="/sign-up"
							>
								<Button
									className="bg-app-brand w-full sm:w-64 h-16 text-white shadow-2xl shadow-app-brand/30 text-xl font-bold group rounded-2xl"
									size="lg"
								>
									Start Building Now
									<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
								</Button>
							</Link>
							<a
								className="w-full sm:w-auto"
								href="https://github.com"
								rel="noreferrer"
								target="_blank"
							>
								<Button
									className="w-full sm:w-48 h-16 border-text-primary/10 hover:border-text-primary/20 hover:bg-white text-text-primary font-bold text-lg rounded-2xl"
									size="lg"
									variant="outline"
								>
									<Github className="mr-2 h-5 w-5" />
									GitHub
								</Button>
							</a>
						</div>

						{/* Social Proof / Tech Stack Bar */}
						<div className="rise-in [animation-delay:400ms] mt-24 pt-12 border-t border-text-primary/5 w-full">
							<p className="text-xs uppercase tracking-[0.2em] font-bold text-text-secondary/50 mb-10">
								THE MODERN REST STACK
							</p>
							<div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
								<div className="flex items-center gap-2 group cursor-default">
									<Layout className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">TanStack Start</span>
								</div>
								<div className="flex items-center gap-2 group cursor-default">
									<KeyRound className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">JWT Auth</span>
								</div>
								<div className="flex items-center gap-2 group cursor-default">
									<Zap className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">HeroUI v3</span>
								</div>
								<div className="flex items-center gap-2 group cursor-default">
									<Server className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">REST API</span>
								</div>
								<div className="flex items-center gap-2 group cursor-default">
									<Code2 className="h-6 w-6 text-app-brand transition-colors group-hover:text-app-brand" />
									<span className="font-bold text-lg">React Query</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section
					className="py-24 bg-app-base/40 backdrop-blur-[24px]"
					id="features"
				>
					<div className="container-page">
						<div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
							<div className="max-w-xl">
								<h2 className="text-4xl md:text-5xl font-serif text-text-primary mb-6 leading-tight max-w-lg">
									Everything you need, nothing you don't.
								</h2>
								<div className="h-1 w-20 bg-app-brand opacity-20 mb-8 rounded-full" />
								<p className="text-text-secondary/80 text-lg leading-relaxed font-medium">
									We've selected the best tools in the ecosystem so you don't have to spend weeks configuring them.
								</p>
							</div>
							<Link to="/sign-up">
								<Button
									className="font-bold group text-app-brand/80 hover:text-app-brand transition-colors"
									variant="ghost"
								>
									See full technical spec{" "}
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Button>
							</Link>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{[
								{
									title: "Backend Agnostic",
									desc: "Talks to any REST backend over a typed fetch client. Keep your API and your frontend cleanly decoupled and independently deployable.",
									icon: <Server className="text-app-brand" />,
								},
								{
									title: "Typed API Client",
									desc: "A thin, fully-typed fetch wrapper with centralized error handling keeps your frontend and backend contracts in sync. Catch errors in dev, not in prod.",
									icon: <Zap className="text-app-brand" />,
								},
								{
									title: "JWT Auth Built-In",
									desc: "Access/refresh tokens, OTP verification, and multi-step signup pre-wired with automatic token refresh and role-based access control out of the box.",
									icon: <Shield className="text-app-brand" />,
								},
								{
									title: "UI for Agents",
									desc: "Optimized for both humans and AI coders. Consistent patterns and clean component structures make development a breeze.",
									icon: <Code2 className="text-app-brand" />,
								},
								{
									title: "Server State Handled",
									desc: "TanStack Query pre-configured for caching, background refetching, and optimistic updates so your data layer stays fast and predictable.",
									icon: <KeyRound className="text-app-brand" />,
								},
								{
									title: "Premium Design",
									desc: "Powered by HeroUI v3 + Tailwind v4. Beautiful, accessible components that look like you spent months on them.",
									icon: <CheckCircle2 className="text-app-brand" />,
								},
							].map((f) => (
								<Card
									className="p-10 border-none shadow-none hover:bg-white/60 transition-all duration-500 rounded-3xl group"
									key={f.title}
								>
									<Card.Content className="p-0">
										<div className="h-14 w-14 rounded-2xl bg-app-brand/5 text-app-brand flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
											{f.icon}
										</div>
										<h3 className="text-2xl font-serif font-bold text-text-primary mb-4">{f.title}</h3>
										<p className="text-text-secondary/70 leading-relaxed font-medium text-base">{f.desc}</p>
									</Card.Content>
								</Card>
							))}
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="py-32">
					<div className="container-page">
						<div className="bg-app-brand rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-2xl shadow-app-brand/40">
							{/* Pattern Overlay */}
							<div
								className="absolute inset-0 opacity-10 pointer-events-none"
								style={{
									backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
									backgroundSize: "32px 32px",
								}}
							></div>

							<div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
								<h2 className="text-4xl md:text-6xl text-white font-serif mb-8 leading-tight">
									Ready to ship your next big idea?
								</h2>
								<p className="text-white/80 text-xl mb-12 leading-relaxed">
									Join founders and developers building faster with the modern REST template. Zero setup, infinite
									potential.
								</p>
								<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
									<Link
										className="w-full sm:w-auto"
										to="/sign-up"
									>
										<Button
											className="bg-white text-app-brand font-bold h-16 px-10 text-xl shadow-xl w-full sm:w-auto rounded-2xl font-sans"
											size="lg"
										>
											Get Started for Free
										</Button>
									</Link>
									<Link
										className="w-full sm:w-auto"
										to="/sign-in"
									>
										<Button
											className="border-white/30 text-white font-bold h-16 px-10 text-xl hover:bg-white/10 w-full sm:w-auto rounded-2xl font-sans"
											size="lg"
											variant="outline"
										>
											View Template Source
										</Button>
									</Link>
								</div>
								<p className="mt-8 text-white/60 text-sm font-medium">MIT Licensed. Open Source. Forever.</p>
							</div>
						</div>
					</div>
				</section>
			</main>

			<footer className="pt-24 pb-12 border-t border-text-primary/5 bg-white/20">
				<div className="container-page">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
						<div className="col-span-1 md:col-span-2">
							<div className="flex items-center gap-3 mb-6">
								<Layout className="h-8 w-8 text-app-brand" />
								<span className="font-serif text-2xl font-bold">{APP_NAME}</span>
							</div>
							<p className="text-text-secondary max-w-sm leading-relaxed mb-8 font-sans">
								The most productive way to build fullstack applications with the best tools in the ecosystem. Designed
								for humans and agents alike.
							</p>
							<div className="flex gap-4">
								<Button
									className="rounded-xl border-text-primary/10"
									isIconOnly
									variant="ghost"
								>
									<Github size={20} />
								</Button>
								<Button
									className="rounded-xl border-text-primary/10"
									isIconOnly
									variant="ghost"
								>
									<Zap size={20} />
								</Button>
								<Button
									className="rounded-xl border-text-primary/10"
									isIconOnly
									variant="ghost"
								>
									<Shield size={20} />
								</Button>
							</div>
						</div>

						<div>
							<h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-text-secondary font-sans">
								Product
							</h4>
							<ul className="flex flex-col gap-4 text-text-secondary font-sans">
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Features
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Integrations
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Pricing
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Changelog
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-text-secondary font-sans">
								Resources
							</h4>
							<ul className="flex flex-col gap-4 text-text-secondary font-sans">
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Documentation
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										Guides
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										GitHub
									</a>
								</li>
								<li>
									<a
										className="hover:text-app-brand transition-colors font-sans"
										href="https://github.com"
									>
										API Reference
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-text-primary/5">
						<p className="text-sm text-text-secondary transition-colors font-sans">
							© 2026 Bernard Sapida. Built with {APP_NAME}.
						</p>
						<div className="flex gap-8 text-xs font-bold text-text-secondary/60 uppercase tracking-wider font-sans">
							<a
								className="hover:text-app-brand transition-colors font-sans"
								href="https://github.com"
							>
								Privacy Policy
							</a>
							<a
								className="hover:text-app-brand transition-colors font-sans"
								href="https://github.com"
							>
								Terms of Service
							</a>
							<a
								className="hover:text-app-brand transition-colors font-sans"
								href="https://github.com"
							>
								Cookie Policy
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
