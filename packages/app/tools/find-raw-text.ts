import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
});

const files = project
  .getSourceFiles()
  .filter((f) => f.getFilePath().includes(`${path.sep}src${path.sep}`))
  .filter((f) => f.getFilePath().endsWith(".tsx"));

// ✅ Props, die sehr wahrscheinlich User-facing sind
const USER_TEXT_PROPS = new Set([
  "title",
  "label",
  "placeholder",
  "helperText",
  "hint",
  "subtitle",
  "caption",
  "message",
  "error",
  "emptyText",
  "confirmText",
  "cancelText",
  "okText",
  "header",
  "description",
  "accessibilityLabel", // optional: je nach Teamentscheidung
]);

// ❌ Props, die fast immer “technisch/design-system” sind
const NON_TEXT_PROPS = new Set([
  "variant",
  "icon",
  "size",
  "color",
  "name",
  "type",
  "mode",
  "resizeMode",
  "pointerEvents",
  "testID",
  "accessibilityRole",
  "outlined",
  "cover", "display",
  "keyboardType",
  "align",
]);

// ❌ Design-System Enum-Werte (ComponentVariant, ComponentSize, TextVariant, etc.)
const DESIGN_SYSTEM_VALUES = new Set([
  // ComponentVariant
  "primary",
  "secondary",
  "outlined",
  // ComponentSize
  "sm",
  "md",
  "lg",
  "xs",
  "xl",
  "small",
  "medium",
  "large",
  // TextVariant
  "heading",
  "title",
  "section",
  "subtitle",
  "body",
  "caption",
  "hint",
  "label",
  // Alignment
  "left",
  "center",
  "right",
  // ResizeMode
  "cover",
  "contain",
  "stretch",
  "repeat",
  // PointerEvents
  "none",
  "box-none",
  "box-only",
  "auto",
  // Display/Mode values
  "spinner",
  "default",
  "compact",
  "inline",
  // KeyboardType
  "default",
  "number-pad",
  "decimal-pad",
  "numeric",
  "email-address",
  "phone-pad",
  "url",
  // Time format
  "2-digit",
  "time",
  // Common technical/state values
  "ready",
  "loading",
  "CANVAS",
  "imageUrl",
  "phoneNumber",
  "verificationCode",
  "local_unverified",
  // Common icon names (MaterialIcons)
  "close",
  "edit",
  "person",
  "more-vert",
  "zoom-out-map",
  "arrow-back",
  "delete",
  "add",
  "remove",
  "check",
  "clear",
  "search",
  "settings",
  "menu",
  "info",
  "warning",
  "error",
  "swap-horiz",
]);

const isInsideTranslationCall = (node: Node) => {
  const call = node.getFirstAncestorByKind(SyntaxKind.CallExpression);
  if (!call) return false;
  const expr = call.getExpression().getText(); // "t" oder "i18n.t" etc.
  return expr === "t" || expr.endsWith(".t");
};

const literalText = (n: Node) => {
  // StringLiteral / NoSubstitutionTemplateLiteral unterstützen getLiteralText()
  return (n as any).getLiteralText?.() ?? n.getText();
};

// ✅ 1) String wird als JSX-Child gerendert (z.B. in { ... } innerhalb eines Elements)
const isRenderedJsxChildString = (stringNode: Node) => {
  const jsxExpr = stringNode.getFirstAncestorByKind(SyntaxKind.JsxExpression);
  if (!jsxExpr) return false;

  const parent = jsxExpr.getParent();
  const isChild = Node.isJsxElement(parent) || Node.isJsxFragment(parent);

  if (!isChild) return false;

  // Exclude design-system enum values even in JSX children
  const value = literalText(stringNode);
  if (DESIGN_SYSTEM_VALUES.has(value)) return false;

  return true;
};

// ✅ 2) String ist Wert eines “User-facing” JSX-Attributes, z.B. title="Save"
const isUserFacingPropString = (stringNode: Node) => {
  const attr = stringNode.getFirstAncestorByKind(SyntaxKind.JsxAttribute);
  if (!attr) return false;

  const name = attr.getNameNode().getText();
  const value = literalText(stringNode);

  // Exclude design-system prop names
  if (NON_TEXT_PROPS.has(name)) return false;

  // Exclude design-system enum values (regardless of prop name)
  if (DESIGN_SYSTEM_VALUES.has(value)) return false;

  return USER_TEXT_PROPS.has(name);
};

type Finding = { file: string; line: number; col: number; text: string; context: string };
const findings: Finding[] = [];

for (const sf of files) {
  const strings = [
    ...sf.getDescendantsOfKind(SyntaxKind.StringLiteral),
    ...sf.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
  ];

  for (const s of strings) {
    const text = literalText(s);

    // ✅ leere Strings ignorieren (z.B. replace(/.../, ''))
    if (text === "") continue;

    // ✅ Übersetzungs-Calls ignorieren
    if (isInsideTranslationCall(s)) continue;

    // ✅ Nur (JSX Child) ODER (User-facing Prop)
    const relevant = isRenderedJsxChildString(s) || isUserFacingPropString(s);
    if (!relevant) continue;

    const pos = sf.getLineAndColumnAtPos(s.getStart());
    const lineText = sf.getFullText().split(/\r?\n/)[pos.line - 1] ?? "";

    findings.push({
      file: sf.getFilePath().replace(process.cwd() + path.sep, ""),
      line: pos.line,
      col: pos.column,
      text,
      context: lineText.trim(),
    });
  }
}

if (findings.length === 0) {
  console.log("✅ Keine relevanten Raw-Strings gefunden.");
  process.exit(0);
}

console.log(`⚠️ Gefunden: ${findings.length}`);
for (const f of findings) {
  console.log(`\n${f.file}:${f.line}:${f.col}\n  "${f.text}"\n  Kontext: ${f.context}`);
}
process.exitCode = 1;
