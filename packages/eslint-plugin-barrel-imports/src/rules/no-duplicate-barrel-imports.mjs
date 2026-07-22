/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow multiple import statements from the same path.',
    },
    schema: [],
    messages: {
      duplicateBarrel: "Duplicate import from '{{path}}'. Merge these imports into a single statement.",
    },
  },

  /**
   * @param {import('eslint').Rule.RuleContext} context
   */
  // eslint-disable-next-line @typescript-eslint/typedef -- JSDoc @param already provides the type
  create(context) {
    const seen = new Map();

    return {
      /**
       * @param {import('estree').ImportDeclaration & import('eslint').Rule.Node} node
       */
      // eslint-disable-next-line @typescript-eslint/typedef -- JSDoc @param already provides the type
      ImportDeclaration(node) {
        const path = node.source.value;
        if (!path) return;

        const first = seen.get(path);
        if (first) {
          context.report({
            node,
            messageId: 'duplicateBarrel',
            data: { path },
          });
        } else {
          seen.set(path, { node });
        }
      },
    };
  },
};

export default rule;
