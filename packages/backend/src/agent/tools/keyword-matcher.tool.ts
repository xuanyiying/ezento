import { Tool } from '@langchain/core/tools';
import { Injectable } from '@nestjs/common';


export interface KeywordMatcherInput {
  sourceKeywords: string[];
  targetKeywords: string[];
}

@Injectable()
export class KeywordMatcherTool extends Tool {
  name = 'keyword_matcher';
  description = 'Matches keywords between two lists and calculates overlap';

  constructor() {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput: KeywordMatcherInput = JSON.parse(input);

      if (!parsedInput.sourceKeywords || !parsedInput.targetKeywords) {
        return JSON.stringify({
          error: 'Invalid input. Expected "sourceKeywords" and "targetKeywords" arrays.',
        });
      }

      const matchResult = this.calculateMatch(
        parsedInput.sourceKeywords,
        parsedInput.targetKeywords
      );

      return JSON.stringify(matchResult);
    } catch (error) {
      return JSON.stringify({
        error: `Failed to process keyword matching: ${error}`,
      });
    }
  }

  /**
   * Calculate keyword overlap between source and target lists
   */
  private calculateMatch(
    sourceKeywords: string[],
    targetKeywords: string[]
  ): {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  } {
    if (!sourceKeywords.length && !targetKeywords.length) {
      return { score: 100, matchedKeywords: [], missingKeywords: [] };
    }

    if (!targetKeywords.length) {
      return { score: 100, matchedKeywords: [], missingKeywords: [] };
    }

    const normalizedSource = sourceKeywords.map((h) => h.toLowerCase());
    const normalizedTarget = targetKeywords.map((k) => k.toLowerCase());

    const matched: string[] = [];
    const missing: string[] = [];

    for (const keyword of normalizedTarget) {
      if (normalizedSource.some((s) => s.includes(keyword) || keyword.includes(s))) {
        matched.push(keyword);
      } else {
        missing.push(keyword);
      }
    }

    const score =
      normalizedTarget.length > 0
        ? (matched.length / normalizedTarget.length) * 100
        : 0;

    return {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      matchedKeywords: matched,
      missingKeywords: missing,
    };
  }
}
