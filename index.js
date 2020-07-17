const parse = require('@typescript-eslint/parser');
const fs = require('fs');
const yargs = require('yargs');

/**
 * @param {string} file
 * @param {'type' | 'value'=} exportKind
 */
module.exports = function getExportNames(file, exportKind) {
  const code = fs.readFileSync(file, 'utf-8');
  const ast = parse.parse(code, {
    sourceType: 'module',
    loc: true,
    range: true,
  });
  /** @type {string[]} */
  const names = [];
  if (ast.type === 'Program') {
    let namedExports = findNamedExports(ast.body);
    if (exportKind !== undefined) {
      namedExports = namedExports.filter(
        (namedExport) => namedExport.exportKind === exportKind
      );
    }
    for (const namedExport of namedExports) {
      const { specifiers, declaration } = namedExport;

      // export from
      specifiers.forEach((specifier) =>
        pushBindingName(names, specifier.exported)
      );

      // export declaration like a class or interface or variable
      if (declaration !== null) {
        if (declaration.type === 'VariableDeclaration') {
          declaration.declarations.forEach((declaration) =>
            pushBindingName(names, declaration.id)
          );
        } else {
          if (declaration.type === 'TSModuleDeclaration') {
            // only module declaration that can be exported should have an id
            if (declaration.id.type === 'Identifier') {
              pushBindingName(names, declaration.id);
            }
          } else {
            // only declaration that can be exported should have an id
            pushBindingName(names, declaration.id);
          }
        }
      }
    }
  }
  return names;
};

/**
 * @param {import('@typescript-eslint/types').TSESTree.Statement[]} statements
 */
function findNamedExports(statements) {
  /**
   * @param {import('@typescript-eslint/types').TSESTree.ExportNamedDeclaration[]} statements
   */
  const namedExports = [];
  for (const statement of statements) {
    if (statement.type === 'ExportNamedDeclaration') {
      namedExports.push(statement);
    }
  }
  return namedExports;
}

/**
 * @param {string[]} names
 * @param {import('@typescript-eslint/types').TSESTree.BindingName | null} binding
 */
function pushBindingName(names, binding) {
  if (binding === null) return;
  switch (binding.type) {
    case 'Identifier':
      names.push(binding.name);
      break;
    case 'ObjectPattern':
      pushObjectPatternNames(names, binding);
      break;
    case 'ArrayPattern':
      pushArrayPatternNames(names, binding);
      break;
  }
}

/**
 * @param {string[]} names
 * @param {import('@typescript-eslint/types').TSESTree.ArrayPattern} arrayPattern
 */
function pushArrayPatternNames(names, arrayPattern) {
  for (const element of arrayPattern.elements) {
    if (element !== null) {
      pushDestructuringPatternNames(names, element);
    }
  }
}

/**
 * @param {string[]} names
 * @param {DestructuringPattern} value
 */
function pushDestructuringPatternNames(names, value) {
  if (value.type === 'Identifier') {
    names.push(value.name);
  } else if (value.type === 'ObjectPattern') {
    pushObjectPatternNames(names, value);
  } else if (value.type === 'ArrayPattern') {
    pushArrayPatternNames(names, value);
  } else if (value.type === 'RestElement') {
    pushDestructuringPatternNames(names, value.argument);
  } else if (value.type === 'AssignmentPattern') {
    pushBindingName(names, value.left);
  }
}

/**
 * @param {string[]} names
 * @param {ObjectPattern} objectPattern
 */
function pushObjectPatternNames(names, objectPattern) {
  for (const property of objectPattern.properties) {
    pushDestructuringPatternNames(
      names,
      /** @type {DestructuringPattern} */ (property.value)
    );
  }
}

/**
 * @typedef {import('@typescript-eslint/types').TSESTree.ArrayPattern} ArrayPattern
 */

/**
 * @typedef {import('@typescript-eslint/types').TSESTree.ObjectPattern} ObjectPattern
 */

/**
 * @typedef {import('@typescript-eslint/types').TSESTree.BindingName} BindingName
 */

/**
 * @typedef {import('@typescript-eslint/types').TSESTree.RestElement} RestElement
 */

/**
 * @typedef {import('@typescript-eslint/types').TSESTree.AssignmentPattern} AssignmentPattern
 */

/**
 * @typedef {import('@typescript-eslint/types').TSESTree.DestructuringPattern} DestructuringPattern
 */
