import * as fs from "fs";
import * as path from "path";
import { AsciiRenderer, SamplingConfig } from "./ascii-renderer";
import { getAllConfigs, Config, ConfigName, getConfig, validateConfigs } from "./configs";
import { combineAlphabets, Alphabet } from "./alphabets";
import { CharacterVector } from "./types";
import { ALPHABETS_OUTPUT_DIR, ensureOutputDirectory, getOutputFilename, getDebugDirectory } from "./constants";

class AsciiVectorBuilder {
  private renderer: AsciiRenderer;
  private samplingConfig: SamplingConfig;
  private characters: string[];
  private maxCharacters: number | null;

  constructor(
    samplingConfig: SamplingConfig,
    characters: string[] = combineAlphabets([Alphabet.ASCII]),
    canvasWidth: number = 48,
    canvasHeight: number = 64,
    fontFamily: string = "monospace",
    fontSize: number = 32,
    customFontPaths: { [key: string]: string[] } = {},
    blurRadius: number = 0,
    maxCharacters: number | null = null,
  ) {
    this.samplingConfig = samplingConfig;
    this.characters = characters;
    this.maxCharacters = maxCharacters;
    this.renderer = new AsciiRenderer(
      canvasWidth,
      canvasHeight,
      samplingConfig,
      fontFamily,
      fontSize,
      customFontPaths,
      blurRadius,
    );
  }

  async buildVectors(
    generateDebugImages: boolean = false,
    debugDir: string = "debug",
  ): Promise<CharacterVector[]> {
    const k = this.samplingConfig.points.length;
    console.log(
      `Building character vectors with ${k} sampling points (r=${this.samplingConfig.circleRadius}px) for ${this.characters.length} characters...`,
    );
    if (generateDebugImages) {
      console.log(`Debug images will be saved to ${debugDir}/`);
    }

    // Generate all vectors
    const vectors: number[][] = [];
    const chars: string[] = [];

    for (let i = 0; i < this.characters.length; i++) {
      const char = this.characters[i];
      console.log(`Processing character '${char}' (${i + 1}/${this.characters.length})`);

      try {
        const vector = this.renderer.generateLightnessVector(char);
        vectors.push(vector);
        chars.push(char);
      } catch (error) {
        console.warn(`Failed to process character '${char}':`, error);
      }
    }

    console.log(`Successfully processed ${vectors.length} characters`);

    // Apply global normalization to preserve relative magnitudes
    console.log("Applying global normalization...");
    AsciiRenderer.normalizeVectorsGlobally(vectors);

    // Select most distinct characters if limit is set
    let finalVectors = vectors;
    let finalChars = chars;
    if (this.maxCharacters && vectors.length > this.maxCharacters) {
      const selected = AsciiVectorBuilder.selectMostDistinctCharacters(
        vectors,
        chars,
        this.maxCharacters,
      );
      finalVectors = selected.vectors;
      finalChars = selected.chars;
    }

    const characterVectors: CharacterVector[] = [];
    for (let i = 0; i < finalVectors.length; i++) {
      characterVectors.push({ char: finalChars[i], vector: finalVectors[i] });

      // Generate debug image if requested (using normalized vector for display)
      if (generateDebugImages) {
        this.renderer.generateDebugImage(finalChars[i], finalVectors[i], debugDir);
      }
    }

    console.log("Character vector generation complete!");
    if (generateDebugImages) {
      console.log(`Debug images saved to ${debugDir}/`);
    }

    return characterVectors;
  }

  static selectMostDistinctCharacters(
    vectors: number[][],
    chars: string[],
    maxCount: number,
  ): { vectors: number[][]; chars: string[] } {
    if (vectors.length <= maxCount) {
      return { vectors, chars };
    }

    console.log(
      `Selecting ${maxCount} most distinct characters from ${vectors.length} candidates...`,
    );

    // Greedy farthest-first algorithm
    const selected: number[] = [];
    const selectedVectors: number[][] = [];
    const selectedChars: string[] = [];

    // Start with the vector closest to the origin (most "neutral" character)
    let firstIndex = 0;
    let minMagnitude = Infinity;
    for (let i = 0; i < vectors.length; i++) {
      const magnitude = Math.sqrt(vectors[i].reduce((sum, val) => sum + val * val, 0));
      if (magnitude < minMagnitude) {
        minMagnitude = magnitude;
        firstIndex = i;
      }
    }

    selected.push(firstIndex);
    selectedVectors.push(vectors[firstIndex]);
    selectedChars.push(chars[firstIndex]);

    // Greedily select remaining characters
    for (let count = 1; count < maxCount; count++) {
      let bestIndex = -1;
      let maxMinDistance = -1;

      // Find the character that has the maximum minimum distance to all selected characters
      for (let i = 0; i < vectors.length; i++) {
        if (selected.includes(i)) continue;

        // Calculate minimum distance to any selected character
        let minDistance = Infinity;
        for (const selectedVector of selectedVectors) {
          const distance = this.euclideanDistance(vectors[i], selectedVector);
          minDistance = Math.min(minDistance, distance);
        }

        // Keep track of the character with the largest minimum distance
        if (minDistance > maxMinDistance) {
          maxMinDistance = minDistance;
          bestIndex = i;
        }
      }

      if (bestIndex !== -1) {
        selected.push(bestIndex);
        selectedVectors.push(vectors[bestIndex]);
        selectedChars.push(chars[bestIndex]);
      }
    }

    console.log(
      `Selected ${selectedChars.length} characters: ${selectedChars.slice(0, 10).join("")}${
        selectedChars.length > 10 ? "..." : ""
      }`,
    );
    return { vectors: selectedVectors, chars: selectedChars };
  }

  static euclideanDistance(v1: number[], v2: number[]): number {
    return Math.sqrt(v1.reduce((sum, val, i) => sum + (val - v2[i]) ** 2, 0));
  }

  // KD tree generation removed - vectors are built at runtime

  async saveCharacterVectors(
    characterVectors: CharacterVector[],
    filename: string = "character-vectors.json",
  ): Promise<void> {
    const data = {
      metadata: {
        samplingConfig: {
          points: this.samplingConfig.points,
          ...(this.samplingConfig.externalPoints && { externalPoints: this.samplingConfig.externalPoints }),
          circleRadius: this.samplingConfig.circleRadius,
        },
        canvasWidth: this.renderer["width"],
        canvasHeight: this.renderer["height"],
        fontFamily: this.renderer["fontFamily"],
        fontSize: this.renderer["fontSize"],
        blurRadius: this.renderer["blurRadius"],
        charactersCount: characterVectors.length,
        buildDate: new Date().toISOString(),
      },
      characters: characterVectors,
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Character vectors saved to ${filename}`);
  }

  // loadTree method removed - KD trees built at runtime
}

async function buildConfigurationVectors(config: Config) {
  const k = config.SAMPLING_CONFIG.points.length;

  // Use alphabets from config
  const alphabets = config.ALPHABETS;
  const characters = combineAlphabets(alphabets);

  console.log(`\n=== Building configuration: ${config.name} ===`);
  console.log(`- Character sets: ${alphabets.join(", ")} (${characters.length} chars)`);
  console.log(
    `- Sampling points: ${k} circles with radius ${config.SAMPLING_CONFIG.circleRadius}px`,
  );
  console.log(`- Canvas size: ${config.CANVAS_WIDTH}x${config.CANVAS_HEIGHT}`);
  console.log(`- Font: ${config.FONT_FAMILY} ${config.FONT_SIZE}px`);
  console.log(`- Output file: ${getOutputFilename(config.name)}`);
  console.log(`- Max characters: ${config.MAX_CHARACTERS || "unlimited"}`);
  console.log(`- Generate debug images: ${config.GENERATE_DEBUG_IMAGES}`);
  if (config.GENERATE_DEBUG_IMAGES) {
    console.log(`- Debug directory: ${getDebugDirectory(config.name)}`);
  }
  console.log();

  const builder = new AsciiVectorBuilder(
    config.SAMPLING_CONFIG,
    characters,
    config.CANVAS_WIDTH,
    config.CANVAS_HEIGHT,
    config.FONT_FAMILY,
    config.FONT_SIZE,
    config.CUSTOM_FONT_PATHS,
    config.BLUR_RADIUS,
    config.MAX_CHARACTERS,
  );

  try {
    const debugDir = getDebugDirectory(config.name);
    
    // Clear existing debug images if generating new ones
    if (config.GENERATE_DEBUG_IMAGES && fs.existsSync(debugDir)) {
      console.log(`Clearing existing debug images in ${debugDir}`);
      fs.rmSync(debugDir, { recursive: true, force: true });
    }
    
    const characterVectors = await builder.buildVectors(
      config.GENERATE_DEBUG_IMAGES,
      debugDir,
    );

    // Generate composite debug image if requested
    if (config.GENERATE_DEBUG_IMAGES && config.GENERATE_COMPOSITE_DEBUG_IMAGE) {
      AsciiRenderer.createCompositeDebugImage(debugDir);
    }

    // Ensure output directory exists
    ensureOutputDirectory();
    
    // Construct full output path
    const outputPath = path.join(ALPHABETS_OUTPUT_DIR, getOutputFilename(config.name));

    // Save character vectors to the output file
    await builder.saveCharacterVectors(characterVectors, outputPath);

    console.log(`✓ Configuration '${config.name}' completed successfully!`);
    console.log(`  - Character vectors saved to: ${outputPath}`);
    console.log(`  - Generated ${characterVectors.length} character vectors`);

    return characterVectors;
  } catch (error) {
    console.error(`✗ Error building configuration '${config.name}':`, error);
    throw error;
  }
}

async function main() {
  // Validate that configs match alphabets
  try {
    validateConfigs();
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Build specific configurations
    const configNames = args as ConfigName[];
    console.log(`Building specific configurations: ${configNames.join(", ")}`);

    for (const configName of configNames) {
      try {
        const config = getConfig(configName);
        await buildConfigurationVectors(config);
      } catch (error) {
        console.error(`Failed to build configuration '${configName}':`, error);
        process.exit(1);
      }
    }
  } else {
    // Build all configurations
    const allConfigs = getAllConfigs();
    console.log(`Building all configurations: ${allConfigs.map((c) => c.name).join(", ")}`);

    for (const config of allConfigs) {
      try {
        await buildConfigurationVectors(config);
      } catch (error) {
        console.error(`Failed to build configuration '${config.name}':`, error);
        process.exit(1);
      }
    }
  }

  console.log("\n🎉 All configurations built successfully!");
}

if (require.main === module) {
  main().catch(console.error);
}
