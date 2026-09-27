<template>
    <div id="page-users" class="h-full overflow-y-auto touch-scroll">
        <div class="max-w-3xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
            <header class="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-800 gap-2">
                <div>
                    <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                        <i class="fa-solid fa-users text-indigo-600 dark:text-indigo-400"></i>
                        <span>{{ $translate('manager.users.title') }}</span>
                    </h1>
                    <p class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ $translate('manager.users.subtitle') }}</p>
                </div>
                <button @click="load" class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium border border-gray-300 dark:border-gray-700 flex items-center gap-1.5">
                    <i class="fa-solid fa-rotate text-xs"></i>
                    <span>{{ $translate('common.actions.refresh') }}</span>
                </button>
            </header>

            <section class="user-panel">
                <div class="flex items-center justify-between mb-2 sm:mb-3">
                    <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                        <i class="fa-solid fa-lock text-indigo-600 dark:text-indigo-400 text-sm"></i>
                        <span>{{ $translate('manager.users.change_password') }}</span>
                    </h2>
                    <span class="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">{{ auth.username }}</span>
                </div>
                <p>{{ $translate('manager.users.subtitle') }}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <label><span>{{ $translate('manager.users.new_password') }}</span><input v-model="myPassword.password" type="password" placeholder="••••••••" class="field" /></label>
                    <label><span>{{ $translate('manager.users.new_password') }}</span><input v-model="myPassword.confirm" type="password" placeholder="••••••••" class="field" /></label>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button @click="changeMyPassword" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2">
                        <i class="fa-solid fa-key text-xs"></i>
                        <span>{{ $translate('common.actions.update') }}</span>
                    </button>
                    <span v-if="passwordMessage" class="text-xs sm:text-sm" :class="ok ? 'text-emerald-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ passwordMessage }}</span>
                </div>
            </section>

            <form @submit.prevent="add" class="user-panel">
                <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    <i class="fa-solid fa-user-plus text-emerald-600 dark:text-emerald-400 text-sm"></i>
                    <span>{{ $translate('manager.users.add_user') }}</span>
                </h2>
                <p>{{ $translate('manager.users.subtitle') }}</p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <label><span>{{ $translate('manager.users.username') }}</span><input v-model.trim="newUser.username" required placeholder="john_doe" class="field" /></label>
                    <label><span>{{ $translate('auth.password') }}</span><input v-model="newUser.password" required minlength="6" type="password" placeholder="••••••••" class="field" /></label>
                    <label>
                        <span>{{ $translate('manager.users.role') }}</span>
                        <select v-model="newUser.role" class="field">
                            <option value="user">{{ $translate('manager.users.role_user') }}</option>
                            <option value="admin">{{ $translate('manager.users.role_admin') }}</option>
                        </select>
                    </label>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2">
                        <i class="fa-solid fa-user-plus text-xs"></i>
                        <span>{{ $translate('common.actions.create') }}</span>
                    </button>
                    <span v-if="message" class="text-xs sm:text-sm" :class="ok ? 'text-emerald-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ message }}</span>
                </div>
            </form>

            <section class="user-panel">
                <div class="flex items-center gap-2 mb-4">
                    <h2>{{ $translate('manager.users.title') }}</h2>
                    <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">{{ users.length }}</span>
                </div>
                <p v-if="!users.length">{{ $translate('common.status.no_data') }}</p>
                <div v-else class="space-y-3">
                    <article v-for="user in users" :key="user.username" class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/70">
                        <div class="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{{ user.username?.charAt(0).toUpperCase() }}</div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">{{ user.username }}<span v-if="user.username === auth.username" class="text-xs text-gray-400">(you)</span><span v-if="isOnline(user)" class="w-2 h-2 rounded-full bg-emerald-500" title="Online"></span></div>
                            <div class="text-xs text-gray-500">{{ user.role }} · {{ formatDate(user.created_at) }} · {{ relative(user.last_active) }}</div>
                        </div>
                        <button @click="openPasswordModal(user.username)" class="px-2.5 py-1 rounded-lg text-xs text-amber-600 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 font-medium">{{ $translate('manager.users.change_password') }}</button>
                        <button v-if="user.username !== auth.username" @click="remove(user.username)" class="px-2.5 py-1 rounded-lg text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 font-medium">{{ $translate('common.actions.delete') }}</button>
                    </article>
                </div>
            </section>
        </div>

        <div v-if="passwordTarget" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <i class="fa-solid fa-key text-indigo-600 dark:text-indigo-400"></i>
                        <span>{{ $translate('manager.users.change_password') }}: <span class="text-indigo-600 dark:text-indigo-400">{{ passwordTarget }}</span></span>
                    </h3>
                    <button @click="passwordTarget = ''" class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300">✕</button>
                </div>
                <label><span class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $translate('manager.users.new_password') }}</span><input v-model="targetPassword" type="password" class="field" :placeholder="$translate('auth.password_placeholder')" /></label>
                <div class="flex justify-end gap-2">
                    <button @click="passwordTarget = ''" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs">{{ $translate('common.actions.cancel') }}</button>
                    <button @click="saveTargetPassword" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">{{ $translate('common.actions.save') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue"
import { createUser, deleteUser, getUsers, updateUserPassword } from "@/api/users"
import { changePassword } from "@/api/session"
import { useAuthStore } from "@/stores/auth"
import { translate } from "@/lang"

const auth = useAuthStore()
const users = ref([])
const newUser = reactive({ username: "", password: "", role: "user" })
const myPassword = reactive({ password: "", confirm: "" })
const message = ref("")
const passwordMessage = ref("")
const ok = ref(false)
const passwordTarget = ref("")
const targetPassword = ref("")

const load = async () => {
    users.value = (await getUsers()) || []
}

const add = async () => {
    try {
        await createUser({ ...newUser })
        Object.assign(newUser, { username: "", password: "", role: "user" })
        message.value = `✓ ${translate('common.status.success')}`
        ok.value = true
        await load()
    } catch (createUserError) {
        message.value = createUserError.message
        ok.value = false
    }
}

const changeMyPassword = async () => {
    if (myPassword.password.length < 6 || myPassword.password !== myPassword.confirm) {
        passwordMessage.value = myPassword.password !== myPassword.confirm ? translate('auth.error_required') : translate('auth.error_required')
        ok.value = false
        return
    }
    try {
        await changePassword(myPassword.password)
        Object.assign(myPassword, { password: "", confirm: "" })
        passwordMessage.value = `✓ ${translate('common.status.success')}`
        ok.value = true
    } catch (changePasswordError) {
        passwordMessage.value = changePasswordError.message
        ok.value = false
    }
}

const remove = async (username) => {
    if (confirm(translate('manager.users.confirm_delete', { username }))) {
        await deleteUser(username)
        await load()
    }
}

const openPasswordModal = (username) => {
    passwordTarget.value = username
    targetPassword.value = ""
}

const saveTargetPassword = async () => {
    if (targetPassword.value.length < 6) return
    try {
        await updateUserPassword(passwordTarget.value, targetPassword.value)
        message.value = `✓ ${translate('common.status.success')}`
        ok.value = true
        passwordTarget.value = ""
    } catch (updatePasswordError) {
        message.value = updatePasswordError.message
        ok.value = false
    }
}

const formatDate = (dateValue) => (dateValue ? new Date(dateValue).toLocaleDateString() : "—")

const relative = (dateValue) => {
    if (!dateValue) return translate('common.status.inactive')
    const elapsedSeconds = (Date.now() - new Date(dateValue).getTime()) / 1000
    return elapsedSeconds < 60 ? "just now" : `${Math.floor(elapsedSeconds / 60)}m ago`
}

const isOnline = (userObject) => userObject.last_active && Date.now() - new Date(userObject.last_active).getTime() < 300000

onMounted(load)
</script>

<style scoped>
.user-panel {
    @apply bg-white dark:bg-gray-800/90 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700/60 shadow-sm;
}
.user-panel h2 {
    @apply font-bold text-sm sm:text-base text-gray-900 dark:text-gray-200 flex items-center gap-2 mb-1;
}
.user-panel p {
    @apply text-xs text-gray-500 dark:text-gray-400 mb-3 sm:mb-4;
}
.user-panel label > span {
    @apply block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1;
}
.field {
    @apply w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:outline-none text-base sm:text-sm text-gray-900 dark:text-white;
}
</style>
