---
status: final review
---
# How to Write Good Docs

Documentation should be simple, clear, and useful. Here's how to create docs people will actually read.

## The Big Picture

1. **Same content in many planes**: Start with user’s perspective, then dive into APIs and contracts, finish with implementation
2. **Consider top-down learning**: Guide the reader from the most broad view and increase detalization in several iterations
3. **Break it down**: Split complex topics into smaller, focused documents
4. **Be conversational**: Explain as if talking to a colleague. Skip corporate jargon and fluff.

## Document Status

Include `status` in metadata to indicate content **credibility**. It is recommended but not mandatory.

Typical values:
- **complete** - Finalized and accurate
- **draft** - Initial version, may have gaps
- **final review** - Ready for feedback before marking complete
- **AI-version, revise it** - Generated content; captured but has not been reviewed
- Or feel free to explain the status in your words

Skip metadata in `! Start Here.md` to reduce noise. Those files should be reader-friendly at maximum.

## Writing Style Tips

- **Use concrete examples**: Real scenarios beat abstract explanations
- **Highlight important points**: Use bold, lists, and headings to guide the eye
- **Link related docs**: Link mentioned terms and concepts to detailed explanations. Mention and link relevant knowledge.
- **Include diagrams**: A picture saves a thousand words

**Code Examples First:**
- Show use cases and pseudocode
- Keep snippets short
- Capture utility snippets. Make them copy&paste executable at least on the local deployment

## AI Use

This prompt turns off LLMs’ default long-winded mode:

> Use simple, conversational yet concise writing style. Skip politeness and wrapping, narrow down to the facts.

Or this whole file could be tagged in an AI-agent chat.

LLMs often sound more human than humans in Turing tests. Try this workflow: dump ideas – AI rewrites – you revise and edit.
