import * as fs from "fs";
import * as path from "path";
import { AsciiRenderer, SamplingConfig } from "./ascii-renderer";
import { getAllConfigs, ConfigName, getConfig, getAvailableConfigNames } from "./configs";
import { combineAlphabets, Alphabet } from "./alphabets";
import { CharacterVector, Config } from "./types";
import {
  ALPHABETS_OUTPUT_DIR,
  ensureOutputDirectory,
  getOutputFilename,
  getDebugDirectory,
} from "./constants";
import { CharacterSelector } from "./character-selection";

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
    pickMostDistinct: number | null = null,
  ) {
    this.samplingConfig = samplingConfig;
    this.characters = characters;
    this.maxCharacters = pickMostDistinct;
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
      const selected = CharacterSelector.selectMostDistinctCharacters(
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

  // KD tree generation removed - vectors are built at runtime

  async saveCharacterVectors(
    characterVectors: CharacterVector[],
    filename: string = "character-vectors.json",
  ): Promise<void> {
    const canvasWidth = this.renderer["width"];
    const canvasHeight = this.renderer["height"];
    const fontSize = this.renderer["fontSize"];
    
    // Calculate character dimensions relative to font size
    const width = canvasWidth / fontSize;
    const height = canvasHeight / fontSize;
    const circleRadius = this.samplingConfig.circleRadius / fontSize;
    
    const data = {
      metadata: {
        samplingConfig: {
          points: this.samplingConfig.points,
          ...(this.samplingConfig.externalPoints && {
            externalPoints: this.samplingConfig.externalPoints,
          }),
          circleRadius: circleRadius,
        },
        fontSize: 1,
        width: width,
        height: height,
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
  console.log(`- Pick most distinct: ${config.PICK_MOST_DISTINCT || "disabled"}`);
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
    config.PICK_MOST_DISTINCT,
  );

  try {
    const debugDir = getDebugDirectory(config.name);

    // Clear existing debug images if generating new ones
    if (config.GENERATE_DEBUG_IMAGES && fs.existsSync(debugDir)) {
      console.log(`Clearing existing debug images in ${debugDir}`);
      fs.rmSync(debugDir, { recursive: true, force: true });
    }

    const characterVectors = await builder.buildVectors(config.GENERATE_DEBUG_IMAGES, debugDir);

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

async function generateAlphabetManager() {
  const configNames = getAvailableConfigNames();
  
  // Generate imports
  const imports = configNames.map(name => 
    `import ${name.replace(/-/g, '')}Alphabet from "./${name}.json";`
  ).join('\n');
  
  // Generate alphabets object
  const alphabetEntries = configNames.map(name => 
    `  "${name}": ${name.replace(/-/g, '')}Alphabet,`
  ).join('\n');
  
  const managerContent = `// This file is auto-generated by scripts/ascii/index.ts
// Do not edit manually - your changes will be overwritten

${imports}

const alphabets = {
${alphabetEntries}
} as const;

export type AlphabetName = keyof typeof alphabets;

export function getAvailableAlphabets(): AlphabetName[] {
  return Object.keys(alphabets) as AlphabetName[];
}

export function getAlphabetCharacterVectors(name: AlphabetName) {
  return alphabets[name].characters;
}

export function getAlphabetMetadata(name: AlphabetName) {
  return alphabets[name].metadata;
}
`;

  const managerPath = path.resolve(__dirname, "../../src/components/AsciiRenderer/alphabets/AlphabetManager.ts");
  fs.writeFileSync(managerPath, managerContent);
  console.log(`Generated AlphabetManager.ts with ${configNames.length} alphabets`);
}

async function main() {
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
  
  // Generate AlphabetManager.ts with all available alphabets
  await generateAlphabetManager();
}

if (require.main === module) {
  main().catch(console.error);
}
