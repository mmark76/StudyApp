# StudyApp Local model selection and distribution review

## Model selection in this change

The Windows Local companion uses the protected OAuth access token to request
`GET https://api.openai.com/v1/models`. It returns only entries marked
`visibility: "list"`, preserving catalog order and showing OpenAI's
`display_name`. The browser sees model names and slugs, never the OAuth token.
The Workspace selection lasts for the current connected session. A random,
non-secret connection identifier in the Local status makes a new connection
reload the list; Refresh models also reloads it on demand.

Before each inference request, the companion checks that the selected slug is
still in that account's current catalog. A missing model stops the request and
asks the user to choose again. Existing Local question flows without a picker
continue to use the first model in the live catalog. Responses keep
`store: false` and `stream: true`. No model is hardcoded as available.

Official contract: [Models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference).

## Public distribution: owner clarification

StudyApp is a personal, non-commercial project, and StudyApp Local runs on the
user's Windows device. The [OpenAI Cookbook](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt)
explicitly includes personal projects that run locally. StudyApp's proprietary
license does not by itself establish that this personal local category is
excluded. The same Cookbook asks developers to review OpenAI's terms and
policies before distributing an integration.

On 2026-11-03, the owner confirmed that public distribution of the proprietary,
non-commercial StudyApp Local Windows package has been clarified with OpenAI or
the applicable official terms and is permitted. This records the owner's
attestation; no separate written OpenAI approval was supplied in this repository,
and this document does not claim OpenAI endorsement. The questions originally
identified for clarification were:

1. Whether a publicly downloadable, source-visible but proprietary,
   non-commercial Windows package remains within the personal-local category;
2. whether its per-user dynamic registration and ChatGPT plan usage may be
   offered to other users without a separate private-client approval;
3. whether distribution, branding, user-facing disclosures or support duties
   impose additional requirements on this package.

Do not use an API-key billing path as an implicit substitute. Release publication
still requires its normal owner approval, reviewed source and CI gates.
