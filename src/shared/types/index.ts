export interface Project {
	id: string
	name: string
	path: string
	createdAt: string
	lastOpenedAt?: string
}

export interface CreateProjectRequest {
	name: string
	path: string
}
