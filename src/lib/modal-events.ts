export type ModalName = "howto" | "terms";

export function openModal(name: ModalName) {
  window.dispatchEvent(new CustomEvent("tb:modal:open", { detail: name }));
}

export function closeModal(name: ModalName) {
  window.dispatchEvent(new CustomEvent("tb:modal:close", { detail: name }));
}
