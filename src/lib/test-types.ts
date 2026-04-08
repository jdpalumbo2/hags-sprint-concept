export const TEST_TYPES = [
  {
    id: "price",
    label: "Price test",
    description: "Find out what people would actually pay",
  },
  {
    id: "value_prop",
    label: "Value proposition test",
    description: "See which message resonates with customers",
  },
  {
    id: "landing_page",
    label: "Landing page test",
    description: "See if people will sign up or click",
  },
  {
    id: "feature",
    label: "Feature test",
    description: "Find out which feature matters most",
  },
  {
    id: "problem",
    label: "Problem test",
    description: "Confirm this is a real problem worth solving",
  },
  {
    id: "ad",
    label: "Ad test",
    description: "See if people will click on your ad or post",
  },
  {
    id: "preorder",
    label: "Pre-order test",
    description: "See if people will commit before you build",
  },
  {
    id: "demo",
    label: "Demo test",
    description: "See if people understand what you're building",
  },
  {
    id: "ab",
    label: "A/B test",
    description: "Compare two versions to see which wins",
  },
  {
    id: "outreach",
    label: "Outreach test",
    description: "See if people respond to your messages",
  },
  {
    id: "custom",
    label: "Something else",
    description: "Describe your own test idea",
  },
] as const;

export type TestTypeId = (typeof TEST_TYPES)[number]["id"];
