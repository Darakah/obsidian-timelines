jest.mock('obsidian');

import { getFrontmatterTime, replaceEnhancedMarkdownSyntax } from 'src/utils';

describe('replaceEnhancedMarkdownSyntax', () => {
  test('substitutes for empty lines', () => {
    expect(replaceEnhancedMarkdownSyntax('**text**')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('__text__')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('*text*')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('_text_')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('~~text~~')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('`text`')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('```\ntext\n```')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('```TypeScript\ntext\n```')).toEqual('TypeScript\ntext');
  })

  test('headlines', () => {
    expect(replaceEnhancedMarkdownSyntax('# text')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('## text')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('### text')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('#### text')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('##### text')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('###### text')).toEqual('text');
    expect(replaceEnhancedMarkdownSyntax('Hi\n## text\nHmm')).toEqual('Hi\ntext\nHmm');
  })

  test('empty lines', () => {
    expect(replaceEnhancedMarkdownSyntax('\n\n\n')).toEqual('');
    expect(replaceEnhancedMarkdownSyntax('\r\r\r')).toEqual('');
    expect(replaceEnhancedMarkdownSyntax('My Text\n    \n Hi asmlkm\nkk\n')).toEqual('My Text\n Hi asmlkm\nkk');
  })

  test('manege blocks', () => {
    expect(replaceEnhancedMarkdownSyntax('123---45\ntags\n67---89')).toEqual('12389');
    expect(replaceEnhancedMarkdownSyntax("<span \nclass='ob-timelines-interpretation' \n> \n</span>")).toEqual('');
  })

  test('general test', () => {
    expect(replaceEnhancedMarkdownSyntax("---\ntags: timeline, pr-lang\n--- \n\n<span \n      class='ob-timelines' \n      > 	\n</span>\n\n**Ассемблер** - это __низкоуровневый__ _язык_ *программирования*, ~~который~~ `предоставляет прямой` доступ\n\n```python\nprint('Hi')\n```\n"))
    .toEqual("Ассемблер - это низкоуровневый язык программирования, который предоставляет прямой доступpython\nprint('Hi')")
  })
})

describe('getFrontmatterTime', () => {
    test('should parse valid AD date with time', () => {
        const time = '2024-02-05-16:30';
        const expected = [true, 202402051630, 1, 2024, 2, 5, 16, 30];

        expect(getFrontmatterTime(time)).toEqual(expected);
    });

    test('should parse valid AD date without time', () => {
        const time = '2024-02-05';
        const expected = [true, 202402050000, 1, 2024, 2, 5, undefined, undefined];

        expect(getFrontmatterTime(time)).toEqual(expected);
    });

    test('should parse valid BC date with time', () => {
        const time = '-1234-05-15-10:45';
        const expected = [true, 123405151045, -1, 1234, 5, 15, 10, 45];

        expect(getFrontmatterTime(time)).toEqual(expected);
    });

    test('should parse valid BC date without time', () => {
        const time = '-1234-05-15';
        const expected = [true, 123405150000, -1, 1234, 5, 15, undefined, undefined];

        expect(getFrontmatterTime(time)).toEqual(expected);
    });

    test('should return false for invalid time format', () => {
        const time = 'invalid-time-format';

        expect(getFrontmatterTime(time)).toEqual([false, undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
    });
})