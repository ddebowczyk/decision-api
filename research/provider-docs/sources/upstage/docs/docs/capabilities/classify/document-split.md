> For the complete documentation index, see [/llms.txt](/llms.txt).

> Source: /docs/capabilities/classify/document-split

# Document split

## Overview

The document splitting feature in Classify API is designed for scenarios where **multiple documents of different types** are combined into a single file (e.g., a single PDF file containing an Application, an ID card, and a Bank Statement).
If you have a document with multiple documents of the same type, you can use [Information Extract](/docs/capabilities/extract/document-split) to split the document for more efficient processing.

## How it works

The separation logic is basically depend on defined classes which means the model will split the document into multiple documents at the boundaries of chaning document types.

Also, user can provide `split_criteria` to add additional criteria for splitting.

For instance, consider a single file containing an Application, an **two** ID card, and a Bank Statement:

- **Without split criteria**: The model might classify the document into each document type defined on class description. (e.g Application, ID card, and Bank Statement)
- **With split criteria**: If user provides `card_id` as split criteria, the model will split the document into each class and then, split the document into each card id. (e.g Application, ID card 1, ID card 2, and Bank Statement)

## Usage

To enable this feature, simply set the `split` parameter to `true` in your request.
Each split document group will be returned as a separate item in the `choices` list.

If split documents are not consecutive in the source document but share the same document class and split criteria results, the model will treat them as a single document.
Accordingly, the page ranges may contain multiple non-contiguous ranges expressed as a list of \[start, end] pairs. (e.g. \[\[1, 3], \[6, 6]])

**Request**

_Request/response examples: document-classification / request / doc-split_

**Response**

_Request/response examples: document-classification / response-200 / doc-split_
