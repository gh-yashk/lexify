def generate_prompt(text: str, keywords: list = [], references: list = []) -> str:
    """Generates a structured prompt for converting a YouTube video transcript or summary into a Markdown document.
    Args:
        text (str): The transcript or summary text from the YouTube video.
        keywords (list, optional): A list of keywords to include in the document. Defaults to an empty list.
        references (list, optional): A list of references to include in the document. Defaults to an empty list.
    Returns:
        str: A formatted prompt string ready for use in a Markdown conversion task.
    """
    prompt = f"""
You are an expert technical writer. You will be given a transcript or summary from a YouTube video. Your task is to convert it into a clean, logically organized, and well-formatted Markdown document (`notes.md`).

## Note:
- Use the text to generate the document.
- Refer to the keyword list if provided.
- Place the references under a proper section if provided.

## Use proper Markdown syntax:
- A clear **title**
- Proper table of contents
- Logical chapters and sections
- Clear headings and subheadings
- Key takeaways in bullet points
- Code blocks (with syntax highlighting like `python`, `bash`, etc.)
- Inline code using double backticks like ``example``
- Equations in LaTeX syntax:
    - Inline: `$y = mx + c$`
    - Block:
    ```
    $$
    y = mx + c
    $$
    ```
- Tables (in standard markdown table format)
- Flow diagrams or charts if appropriate

## Goal:
- Ensure the output is concise and coherent
- Use proper Markdown syntax throughout
- Include code, expressions, tables, or diagrams **only if needed**

## Special Instructions for Transcripts:
- Assume the input may be informal or conversational
- Add structure even if the original transcript lacks it.
- Remove filler words or irrelevant parts
- Where possible, infer or group related ideas into logical sections.

## Input Text:
{text.strip()}
"""
    if keywords:
        prompt += f"\n\n## Keywords:\n- {', '.join(keywords)}"
    if references:
        prompt += f"\n\n## References:\n- " + "\n- ".join(references)

    return prompt.strip() + "\n"
