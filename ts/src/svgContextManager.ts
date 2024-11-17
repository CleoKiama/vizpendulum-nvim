// svgContextManager.ts
import { parseHTML } from "linkedom";

class SVGContextManager {
	private static instance: SVGContextManager;
	private document: Document;
	private containers: Map<string, HTMLElement>;

	private constructor() {
		const { document } = parseHTML("<!DOCTYPE html><html><body></body></html>");
		this.document = document;
		this.containers = new Map();
	}

	public static getInstance(): SVGContextManager {
		if (!SVGContextManager.instance) {
			SVGContextManager.instance = new SVGContextManager();
		}
		return SVGContextManager.instance;
	}

	public createContainer(id: string): HTMLElement {
		if (this.containers.has(id)) {
			throw new Error(`Container with id ${id} already exists`);
		}

		const container = this.document.createElement("div");
		container.id = id;
		this.document.body.appendChild(container);
		this.containers.set(id, container);

		return container;
	}

	public getContainer(id: string): HTMLElement {
		const container = this.containers.get(id);
		if (!container) {
			throw new Error(`Container with id ${id} not found`);
		}
		return container;
	}

	public clearContainer(id: string): void {
		const container = this.getContainer(id);
		container.innerHTML = "";
	}

	public removeContainer(id: string): void {
		const container = this.getContainer(id);
		container.remove();
		this.containers.delete(id);
	}
}

export default SVGContextManager;
