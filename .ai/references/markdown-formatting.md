# Markdown Formatting Guidelines

Guidelines for creating and maintaining markdown files across the repository. These rules ensure consistent formatting and linter compliance.

## Code Block Formatting (MD031)

Fenced code blocks must be surrounded by blank lines.

Incorrect:

````markdown
Some text:
```powershell
command here
```
Next section...
````

Correct:

````markdown
Some text:

```powershell
command here
```

Next section...
````

- Add a blank line before the opening code fence
- Add a blank line after the closing code fence
- Applies to all code fence types (bash, powershell, json, xml, typescript, etc.)

## Code Language Specification (MD040)

All fenced code blocks must specify a language.

```markdown
Correct: ```powershell
Correct: ```bash
Correct: ```json
Correct: ```xml
Correct: ```typescript
Incorrect: ```
```

Use `text` if no specific language applies.

## Blank Lines Around Headings (MD022)

Headings must be surrounded by blank lines.

Incorrect:

```markdown
Some text here
## Heading
- List item
```

Correct:

```markdown
Some text here

## Heading

- List item
```

Exception: The first heading in a file does not need a blank line before it.

## Blank Lines Around Lists (MD032)

Lists must be surrounded by blank lines.

Incorrect:

```markdown
Some text here
- List item 1
- List item 2
Next paragraph
```

Correct:

```markdown
Some text here

- List item 1
- List item 2

Next paragraph
```

Applies to both unordered (`-`) and ordered (`1.`) lists.

## Ordered List Numbering (MD029)

Ordered lists must use sequential numbering starting at 1.

Incorrect:

```markdown
1. First item
2. Second item
5. Third item
```

Correct:

```markdown
1. First item
2. Second item
3. Third item
```

## Heading Hierarchy (MD001)

Heading levels must only increment by one level at a time. Do not skip levels.

Incorrect:

```markdown
## Level 2 heading
##### Level 5 heading
```

Correct:

```markdown
## Level 2 heading
### Level 3 heading
#### Level 4 heading
```

You can go back to any previous level (e.g., h4 to h2).

## Duplicate Headings (MD024)

Avoid multiple headings with the same text. Add context to differentiate them:

- `#### WorkloadManifest.xml` becomes `#### WorkloadManifest.xml template`
- Restructure content if duplicate headings indicate overlapping sections

## Table Formatting (MD060)

Table columns must have proper spacing around pipes.

Incorrect:

```markdown
| Column1 | Column2 |
|---------|---------|
```

Correct:

```markdown
| Column1 | Column2 |
| ------- | ------- |
```

## When Creating New Markdown Files

1. Blank lines around all code blocks
2. Consistent heading hierarchy (do not skip levels)
3. Proper list formatting (blank lines between complex list items)
4. Consistent use of bold, italic, and code formatting

## When Editing Existing Markdown Files

- Fix formatting violations you encounter as part of your edits
- Do not make formatting-only commits unless specifically requested
- Batch multiple formatting fixes together when touching a file

## Linter Rules Summary

| Rule | Description |
| ---- | ----------- |
| MD001 | Heading levels increment by one |
| MD022 | Headings surrounded by blank lines |
| MD024 | No duplicate heading text |
| MD029 | Ordered list sequential numbering |
| MD031 | Code blocks surrounded by blank lines |
| MD032 | Lists surrounded by blank lines |
| MD040 | Code blocks specify a language |
| MD060 | Table columns have proper spacing |
