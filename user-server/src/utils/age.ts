
/**
 * 计算年龄
 * @param birthDate 出生日期
 * @returns 年龄
 */
export const  calculateAge = (birthDate: Date): number =>{
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}