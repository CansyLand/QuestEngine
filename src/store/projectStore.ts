import { create } from 'zustand'
import { Project } from '@/shared/types'

interface ProjectState {
	currentProject: Project | null
	setCurrentProject: (project: Project | null) => void
	projects: Project[]
	setProjects: (projects: Project[]) => void
	loading: boolean
	setLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectState>((set: any) => ({
	currentProject: null,
	setCurrentProject: (project: Project | null) => set({ currentProject: project }),

	projects: [],
	setProjects: (projects: Project[]) => set({ projects }),

	loading: false,
	setLoading: (loading: boolean) => set({ loading }),
}))

