/** A Base44 edge function: it takes a Request and answers with a Response. */
declare const handler: (req: Request) => Promise<Response>;
export default handler;
