document.addEventListener('DOMContentLoaded', () => {
	const possibleImages = [
		'images/ahoi.jpg',
		'images/hey.jpg',
		'images/hi.jpg',
		'images/kobs.jpg',
		'images/moin.jpg',
	];
	const selectedImage =
		possibleImages[Math.floor(Math.random() * possibleImages.length)];

	const outputElement = document.getElementById('asciiOutput');
	const renderer = new AsciiArtHillClimbing(outputElement, selectedImage, {
		cols: 80,
		rows: 15,
        displayUpdateFrequency: 5,
        iterationDelay: 0,
		blur: false,
        asciiChars: "    1000",
        mutationCount: 1,
	});
	renderer.start();
});
