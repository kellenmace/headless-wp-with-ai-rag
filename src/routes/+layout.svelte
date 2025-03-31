<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<main class="container mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>
