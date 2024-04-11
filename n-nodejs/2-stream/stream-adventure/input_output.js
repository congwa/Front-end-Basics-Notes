
/**
 * 从 process.stdin 获取数据并将其通过管道传输到 process.stdout。
 * 用 .pipe().process.stdin.pipe()。
 */
process.stdin.pipe(process.stdout)