> For the complete documentation index, see [/llms.txt](/llms.txt).

# Document Classify

> Source: /docs/models/document-classify

Semantic classification into user-defined classes

[Try in Studio](https://studio.upstage.ai/library?lang=ko%2Cen&steps=parse%2Cclassify&utm_medium=console&utm_source=docs)

- **Max pages per request**: 100 pages
- **Supported character sets**: A · 가 · あ · ア · 漢
- **Outputs**: Classification Result
- **Price**: $0.004/page (Standard)

The universal product for identifying document types across any format, including mixed-document files. It delivers consistent, template-free classification ready for enterprise workflows.

- Format-agnostic classification
- No templates or training required
- Flexible labels for any workflow

## Supported file formats

- JPEG: Supported
- PNG: Supported
- BMP: Supported
- TIFF: Supported
- HEIC: Supported
- PDF: Supported
- DOCX: Supported
- PPTX: Supported
- XLSX: Supported
- HWP: Supported
- HWPX: Supported

## Maximum file size

50MB

## Maximum number of pages per file

Synchronous API: **100 pages** (For files exceeding 100 pages, the first 100 pages are processed)

## Maximum pixels per page

**200,000,000 pixels**

(For non-image files, the pixel count is determined after converting to images at a standard of 150 DPI.)

## Supported character sets (if using OCR)

- Alphanumeric: Input and output
- Hangul: Input and output
- Hiragana: Input and output
- Katakana: Input and output
- Hanja: Input and output
- Hanzi (Beta): Not fully supported
- Kanji (Beta): Not fully supported

Hanja, Hanzi, and Kanji are writing systems based on Chinese characters used in Korean, Chinese, and Japanese writing systems. Despite sharing similarities, they possess distinct visual representations, pronunciations, meanings, and usage conventions within their respective linguistic contexts. For more information, see [this article](https://en.wikipedia.org/wiki/Hanja).

## Available Platforms

- Upstage Console
- [On-premises](https://www.upstage.ai/contact-us?utm_medium=console&utm_source=docs-models&utm_content=text-link)

## API privacy

Data not collected

Upstage does not collect any data from this API

1. API input data is not used for model training.
2. API input data is not stored, unless required for service delivery and explicitly stated.
