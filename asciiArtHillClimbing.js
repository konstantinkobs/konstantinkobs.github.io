/**
 * AsciiArtHillClimbing
 * A configurable hill-climbing ASCII art renderer that converts an image (or text) into ASCII art.
 *
 * Usage:
 *   // Ensure your target element exists in the DOM.
 *   const targetEl = document.getElementById("asciiOutput");
 *   // For example, to recreate an image ("image.jpg") into ASCII with 80 columns and 15 rows,
 *   // updating 5 characters per iteration:
 *   const renderer = new AsciiArtHillClimbing(targetEl, "image.jpg", {
 *     cols: 80,
 *     rows: 15,
 *     cellWidth: 10,
 *     cellHeight: 10,
 *     asciiChars: " #",
 *     blur: true,
 *     iterationDelay: 10,         // Delay (ms) between iterations
 *     displayUpdateFrequency: 10, // Update display every 10 accepted changes
 *     maxIterations: 100000,      // Stop after 100k iterations
 *     stoppingThreshold: 0.1,     // Stop if MSE falls below 0.1
 *     mutationCount: 5            // Number of characters to update per iteration
 *   });
 *   renderer.start();
 */
class AsciiArtHillClimbing {
  constructor(targetElement, imageUrl, options = {}) {
    if (!targetElement) {
      throw new Error("targetElement is null. Please provide a valid DOM element.");
    }
    this.targetElement = targetElement;
    this.imageUrl = imageUrl;

    // Configuration options with defaults.
    this.cols = options.cols || 60;
    this.rows = options.rows || 30;
    this.cellWidth = options.cellWidth || 10;
    this.cellHeight = options.cellHeight || 10;
    this.asciiChars = options.asciiChars || " #"; // Default: space and "#"
    this.applyBlur = options.blur !== undefined ? options.blur : true;
    this.iterationDelay = options.iterationDelay || 0; // in ms
    this.displayUpdateFrequency = options.displayUpdateFrequency || 10;
    this.maxIterations = options.maxIterations || Infinity;
    this.stoppingThreshold = options.stoppingThreshold !== undefined ? options.stoppingThreshold : 0.1;
    // NEW: Number of characters to update per iteration.
    this.mutationCount = options.mutationCount || 1;

    // Offscreen canvases.
    // Canvas for the target image (scaled to cols x rows).
    this.targetCanvas = document.createElement("canvas");
    this.targetCanvas.width = this.cols;
    this.targetCanvas.height = this.rows;
    this.targetCtx = this.targetCanvas.getContext("2d");

    // Canvas for rendering ASCII art at high resolution.
    this.asciiRenderCanvas = document.createElement("canvas");
    this.asciiRenderCanvas.width = this.cols * this.cellWidth;
    this.asciiRenderCanvas.height = this.rows * this.cellHeight;
    this.asciiCtx = this.asciiRenderCanvas.getContext("2d");

    // Canvas to downscale rendered ASCII art to (cols x rows) for metric computation.
    this.asciiScaledCanvas = document.createElement("canvas");
    this.asciiScaledCanvas.width = this.cols;
    this.asciiScaledCanvas.height = this.rows;
    this.asciiScaledCtx = this.asciiScaledCanvas.getContext("2d");

    // Internal variables.
    this.targetGrayscale = [];
    this.bestScore = Infinity; // For MSE, lower is better.
    this.asciiArray = new Array(this.cols * this.rows);
    this.iterationCount = 0;
    this.acceptedChanges = 0;
    this._running = false;
  }

  // Returns a grayscale array from the specified canvas context.
  getGrayscale(ctx, width, height) {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    const grayscale = new Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = imgData[i * 4],
            g = imgData[i * 4 + 1],
            b = imgData[i * 4 + 2];
      grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    return grayscale;
  }

  // Applies a simple box blur to a grayscale array.
  blurGrayscaleArray(arr, width, height) {
    const blurred = new Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0, count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += arr[ny * width + nx];
              count++;
            }
          }
        }
        blurred[y * width + x] = sum / count;
      }
    }
    return blurred;
  }

  // Returns the (optionally blurred) grayscale array from the downscaled ASCII canvas.
  getAsciiGrayscale() {
    const raw = this.getGrayscale(this.asciiScaledCtx, this.cols, this.rows);
    return this.applyBlur ? this.blurGrayscaleArray(raw, this.cols, this.rows) : raw;
  }

  // Renders the current ASCII grid onto the high-res canvas and downscales it.
  renderAsciiToCanvas(arr) {
    // Clear high-res canvas.
    this.asciiCtx.fillStyle = "white";
    this.asciiCtx.fillRect(0, 0, this.asciiRenderCanvas.width, this.asciiRenderCanvas.height);
    // Set text style.
    this.asciiCtx.fillStyle = "black";
    this.asciiCtx.font = this.cellHeight + "px monospace";
    this.asciiCtx.textBaseline = "top";
    // Draw each character.
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const char = arr[r * this.cols + c];
        this.asciiCtx.fillText(char, c * this.cellWidth, r * this.cellHeight);
      }
    }
    // Downscale the high-res canvas to (cols x rows).
    this.asciiScaledCtx.drawImage(
      this.asciiRenderCanvas,
      0, 0, this.asciiRenderCanvas.width, this.asciiRenderCanvas.height,
      0, 0, this.asciiScaledCanvas.width, this.asciiScaledCanvas.height
    );
  }

  // Computes the Mean Squared Error (MSE) between two grayscale arrays.
  computeMSE(arr1, arr2, width, height) {
    let mse = 0;
    const N = width * height;
    for (let i = 0; i < N; i++) {
      const diff = arr1[i] - arr2[i];
      mse += diff * diff;
    }
    return mse / N;
  }

  // Updates the target HTML element with the current ASCII art.
  updateAsciiDisplay() {
    let asciiString = "";
    for (let r = 0; r < this.rows; r++) {
      asciiString += this.asciiArray.slice(r * this.cols, (r + 1) * this.cols).join("") + "\n";
    }
    this.targetElement.textContent = asciiString;
  }

  // Loads the target image and scales it to the specified (cols x rows) dimensions.
  loadTargetImage(callback) {
    const img = new Image();
    img.src = this.imageUrl;
    img.onload = () => {
      // Scale the entire image to (cols x rows) regardless of original aspect ratio.
      this.targetCtx.drawImage(img, 0, 0, this.cols, this.rows);
      this.targetGrayscale = this.getGrayscale(this.targetCtx, this.cols, this.rows);
      if (callback) callback();
    };
    img.onerror = () => {
      console.error("Failed to load image:", this.imageUrl);
    };
  }

  // Randomly initializes the ASCII grid.
  initAsciiArray() {
    for (let i = 0; i < this.asciiArray.length; i++) {
      this.asciiArray[i] = this.asciiChars[Math.floor(Math.random() * this.asciiChars.length)];
    }
  }

  // Initializes and starts the hill-climbing process.
  initHillClimbing() {
    this.initAsciiArray();
    this.renderAsciiToCanvas(this.asciiArray);
    const currentGray = this.getAsciiGrayscale();
    this.bestScore = this.computeMSE(this.targetGrayscale, currentGray, this.cols, this.rows);
    this.updateAsciiDisplay();
    this.iterationCount = 0;
    this.acceptedChanges = 0;
    this._running = true;
    this.hillClimbStep();
  }

  // Performs one iteration of hill climbing by applying a batch of random changes.
  hillClimbStep() {
    if (!this._running) return;
    if (this.iterationCount >= this.maxIterations) {
      console.log("Reached maximum iterations.");
      this._running = false;
      return;
    }
    this.iterationCount++;

    // Create a candidate copy.
    let candidate = this.asciiArray.slice();
    // Apply mutationCount random changes.
    for (let i = 0; i < this.mutationCount; i++) {
      const idx = Math.floor(Math.random() * candidate.length);
      const oldChar = candidate[idx];
      let newChar = this.asciiChars[Math.floor(Math.random() * this.asciiChars.length)];
      while (newChar === oldChar) {
        newChar = this.asciiChars[Math.floor(Math.random() * this.asciiChars.length)];
      }
      candidate[idx] = newChar;
    }

    // Render candidate and compute its blurred MSE.
    this.renderAsciiToCanvas(candidate);
    const newGray = this.getAsciiGrayscale();
    const newScore = this.computeMSE(this.targetGrayscale, newGray, this.cols, this.rows);

    // If candidate is better, accept it.
    if (newScore < this.bestScore) {
      this.bestScore = newScore;
      this.acceptedChanges += this.mutationCount;
      // Update display only every displayUpdateFrequency accepted changes.
      if (this.acceptedChanges % this.displayUpdateFrequency === 0) {
        this.asciiArray = candidate;
        this.updateAsciiDisplay();
      } else {
        // Even if not updating the display, update the current solution.
        this.asciiArray = candidate;
      }
      // Check stopping condition.
      if (this.bestScore < this.stoppingThreshold) {
        console.log("Stopping: Reached MSE threshold:", this.bestScore);
        this.updateAsciiDisplay();
        this._running = false;
        return;
      }
      console.log("Iteration", this.iterationCount, "Accepted batch change. MSE:", this.bestScore);
    }
    // Otherwise, discard candidate (asciiArray remains unchanged).

    // Schedule next iteration.
    if (this.iterationDelay > 0) {
      setTimeout(() => this.hillClimbStep(), this.iterationDelay);
    } else {
      requestAnimationFrame(() => this.hillClimbStep());
    }
  }

  // Public method to start the optimization.
  start() {
    this.loadTargetImage(() => {
      this.initHillClimbing();
    });
  }

  // Public method to stop the optimization.
  stop() {
    this._running = false;
  }
}

// Expose the class as a global variable.
window.AsciiArtHillClimbing = AsciiArtHillClimbing;
